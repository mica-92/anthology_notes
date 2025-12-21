const SUPABASE_URL = 'https://mtzdqlhketqsoqiepule.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10emRxbGhrZXRxc29xaWVwdWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5MjM5ODEsImV4cCI6MjA3ODQ5OTk4MX0.oGzOakzoTndR9IQK3dhPnYLpUsy19asrojB8yTpJCZc';

// 1. CORRECCIÓN: Cambiamos el nombre de 'supabase' a 'supabaseClient' para evitar conflicto con la librería CDN
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// Base de datos simplificada
const AstroNotesDB = {
    async getTarotEntries(filters = {}) {
        try {
            let query = supabaseClient
                .from('log_entries')
                .select('*')
                .eq('entry_type', 'daily')  // Solo entradas diarias
                .order('date', { ascending: false });

            // Filtrar solo las que tienen notas
            query = query.not('notes', 'is', null).not('notes', 'eq', '');

            if (filters.dateFrom) {
                query = query.gte('date', filters.dateFrom);
            }
            
            if (filters.dateTo) {
                query = query.lte('date', filters.dateTo);
            }
            
            if (filters.search) {
                query = query.or(`notes.ilike.%${filters.search}%`);
            }

            const { data, error } = await query;
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error al obtener entradas de tarot:', error);
            this.showSnackbar('Error al cargar entradas de tarot', 'error');
            return [];
        }
    },

    setupTypeFilters() {
        const typeFilters = document.createElement('div');
        typeFilters.className = 'filter-type';
        typeFilters.innerHTML = `
            <div class="type-filter-chip active" data-type="all">Todas</div>
            <div class="type-filter-chip" data-type="note">Notas</div>
            <div class="type-filter-chip" data-type="tarot">Tarot</div>
        `;
        
        // Insertar después del título de la sección de notas
        const notesSection = document.getElementById('notes-section');
        const header = notesSection.querySelector('.section-header');
        header.appendChild(typeFilters);
        
        // Agregar listeners
        typeFilters.querySelectorAll('.type-filter-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                typeFilters.querySelectorAll('.type-filter-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                this.currentFilters.type = chip.dataset.type === 'all' ? null : chip.dataset.type;
                this.loadNotes();
            });
        });
    },

    // Modificar getAllNotesAndEntries para soportar filtro por tipo:
    async getAllNotesAndEntries(filters = {}) {
        try {
            // Obtener ambas fuentes de datos
            const [notes, tarotEntries] = await Promise.all([
                this.getAllNotes(filters),
                this.getTarotEntries(filters)
            ]);
            
            // Formatear notas
            const formattedNotes = notes.map(note => ({
                id: `note-${note.id}`,
                type: 'note',
                title: note.title || 'Sin título',
                date: note.fecha,
                content: note.nota,
                tags: note.tags || [],
                created_at: note.created_at,
                source: 'astro_notes'
            }));
            
            // Formatear entradas de tarot
            const formattedTarot = tarotEntries.map(entry => ({
                id: `tarot-${entry.id}`,
                type: 'tarot',
                // CAMBIO: Cambiar "Tarot:" por "Arcana:"
                title: entry.tarot_card?.Name ? `Arcana: ${entry.tarot_card.Name}` : 'Arcana',
                date: entry.date.split('T')[0],
                content: entry.notes,
                tags: entry.tarot_card ? [
                    entry.tarot_card.Name,
                    entry.tarot_card.Suit,
                    entry.tarot_card.Type,
                    entry.tarot_card.Sign || null,
                    entry.tarot_card.Element || null,
                    entry.tarot_card.Planet || null
                ].filter(tag => tag) : [],
                orientation: entry.tarot_orientation,
                tarot_card: entry.tarot_card,
                created_at: entry.created_at,
                source: 'log_entries'
            }));
            
            // Combinar según filtro de tipo
            let combined = [];
            if (!filters.type || filters.type === 'all') {
                combined = [...formattedNotes, ...formattedTarot];
            } else if (filters.type === 'note') {
                combined = formattedNotes;
            } else if (filters.type === 'tarot') {
                combined = formattedTarot;
            }
            
            // Ordenar por fecha descendente
            return combined.sort((a, b) => new Date(b.date) - new Date(a.date));
        } catch (error) {
            console.error('Error al combinar datos:', error);
            return [];
        }
    },

    async getAllNotes(filters = {}) {
        try {
            let query = supabaseClient
                .from('astro_notes')
                .select('*')
                .order('fecha', { ascending: false });

            if (filters.search) {
                query = query.or(`nota.ilike.%${filters.search}%,title.ilike.%${filters.search}%`);
            }
            
            if (filters.dateFrom) {
                query = query.gte('fecha', filters.dateFrom);
            }
            
            if (filters.dateTo) {
                query = query.lte('fecha', filters.dateTo);
            }
            
            if (filters.tags && filters.tags.length > 0) {
                query = query.overlaps('tags', filters.tags);
            }

            const { data, error } = await query;
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error al obtener notas:', error);
            this.showSnackbar('Error al cargar notas', 'error');
            return [];
        }
    },

    async getNoteById(id) {
        try {
            const { data, error } = await supabaseClient
                .from('astro_notes')
                .select('*')
                .eq('id', id)
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error al obtener nota:', error);
            this.showSnackbar('Error al cargar la nota', 'error');
            return null;
        }
    },

    async createNote(noteData) {
        try {
            const { data, error } = await supabaseClient
                .from('astro_notes')
                .insert([noteData])
                .select()
                .single();
            
            if (error) throw error;
            this.showSnackbar('Nota creada correctamente', 'success');
            return data;
        } catch (error) {
            console.error('Error al crear nota:', error);
            this.showSnackbar('Error al crear la nota', 'error');
            throw error;
        }
    },

    async updateNote(id, noteData) {
        try {
            const { data, error } = await supabaseClient
                .from('astro_notes')
                .update(noteData)
                .eq('id', id)
                .select()
                .single();
            
            if (error) throw error;
            this.showSnackbar('Nota actualizada correctamente', 'success');
            return data;
        } catch (error) {
            console.error('Error al actualizar nota:', error);
            this.showSnackbar('Error al actualizar la nota', 'error');
            throw error;
        }
    },

    async deleteNote(id) {
        try {
            const { error } = await supabaseClient
                .from('astro_notes')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            this.showSnackbar('Nota eliminada correctamente', 'success');
            return true;
        } catch (error) {
            console.error('Error al eliminar nota:', error);
            this.showSnackbar('Error al eliminar la nota', 'error');
            throw error;
        }
    },

    showSnackbar(message, type = 'info') {
        const snackbar = document.getElementById('snackbar');
        const snackbarMessage = document.getElementById('snackbar-message');
        
        snackbarMessage.textContent = message;
        snackbar.style.display = 'block';
        
        // Set color based on type
        if (type === 'error') {
            snackbar.style.backgroundColor = 'var(--nb-secondary)';
            snackbarMessage.style.color = 'var(--nb-light)';
        } else if (type === 'success') {
            snackbar.style.backgroundColor = 'var(--nb-primary)';
            snackbarMessage.style.color = 'var(--nb-light)';
        }
        
        setTimeout(() => {
            snackbar.style.display = 'none';
        }, 3000);
    }
};

// Aplicación principal
class AstroNotesApp {
    constructor() {
        this.currentFilters = {};
        this.currentNoteId = null;
        this.selectedTags = new Set();
        this.currentSymbolCategory = 'Todos';
        this.CATEGORY_COLORS = CATEGORY_COLORS; // Hacer accesible
        this.initialize();
    }

    // Función para verificar si un tag es una carta de tarot
    isTarotCard(tagName) {
        return Object.values(tarotCards).some(card => card.Name === tagName);
    }

    setupTarotAutocomplete() {
        const customTagInput = document.getElementById('custom-tag');
        const dataList = document.createElement('datalist');
        dataList.id = 'tarot-suggestions';
        
        // Agregar todas las cartas del tarot al datalist
        Object.keys(tarotCards).forEach(key => {
            const card = tarotCards[key];
            const option = document.createElement('option');
            option.value = card.Name;
            dataList.appendChild(option);
        });
        
        customTagInput.setAttribute('list', 'tarot-suggestions');
        customTagInput.parentNode.appendChild(dataList);
    }

    initialize() {
        this.setupEventListeners();
        this.loadSymbols();
        this.loadNotes();
        this.setCurrentDate();
        this.setupTheme();
        this.setupTarotAutocomplete();
    }

    setupEventListeners() {
        // Navegación
        document.querySelectorAll('.nav-item, .bottom-nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchSection(item.dataset.section);
            });
        });

        // Cerrar snackbar
        document.querySelector('.snackbar-close')?.addEventListener('click', () => {
            document.getElementById('snackbar').style.display = 'none';
        });

        // Búsqueda en tiempo real
        document.querySelector('.search-input').addEventListener('input', (e) => {
            this.currentFilters.search = e.target.value.trim() || null;
            this.loadNotes();
        });

        // Formulario de nueva nota
        document.getElementById('note-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveNote();
        });

        // Botones de acción
        document.getElementById('clear-form').addEventListener('click', () => this.clearForm());
        document.getElementById('apply-filters').addEventListener('click', () => this.applyFilters());
        document.getElementById('clear-filters').addEventListener('click', () => this.clearFilters());
        
        // Modal
        document.querySelector('.modal-close').addEventListener('click', () => this.closeModal());
        document.getElementById('edit-note').addEventListener('click', () => this.editNote());
        document.getElementById('delete-note').addEventListener('click', () => this.deleteNote());
        
        // Etiqueta personalizada
        document.getElementById('custom-tag').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const tagName = e.target.value.trim();
                if (tagName) {
                    this.addCustomTag(tagName);
                    e.target.value = '';
                }
            }
        });

        // Botón de tema
        document.querySelector('.theme-toggle').addEventListener('click', () => this.toggleTheme());

        // FAB para nueva nota
        document.querySelector('.md-fab').addEventListener('click', () => {
            this.switchSection('new-note');
        });

        // Chips de filtro de notas
        document.querySelectorAll('#notes-section .md-chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                // Remove active class from all chips
                document.querySelectorAll('#notes-section .md-chip').forEach(c => {
                    c.classList.remove('active');
                });
                // Add active to clicked chip
                chip.classList.add('active');
                // Apply filter based on data-filter attribute
                const filter = chip.dataset.filter;
                this.applyNoteFilter(filter);
            });
        });

        this.setupTypeFilters();

        // Modal del tarot
        document.querySelector('.tarot-modal-close')?.addEventListener('click', () => this.closeTarotModal());
        
        // Abrir modal del tarot al hacer clic en tags de tarot
        document.addEventListener('click', (e) => {
            const tag = e.target.closest('.tag');
            if (tag && tag.dataset.category === 'Tarot') {
                const tagName = tag.dataset.name;
                if (tagName && tarotCards[tagName]) {
                    this.openTarotModal(tagName);
                }
            }
        });
    }

    setupTypeFilters() {
        const typeFilters = document.createElement('div');
        typeFilters.className = 'filter-type';
        typeFilters.innerHTML = `
            <div class="type-filter-chip active" data-type="all">Todas</div>
            <div class="type-filter-chip" data-type="note">Notas</div>
            <div class="type-filter-chip" data-type="tarot">Tarot</div>
        `;
        
        // Insertar después del título de la sección de notas
        const notesSection = document.getElementById('notes-section');
        const header = notesSection.querySelector('.section-header');
        header.appendChild(typeFilters);
        
        // Agregar listeners
        typeFilters.querySelectorAll('.type-filter-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                typeFilters.querySelectorAll('.type-filter-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                this.currentFilters.type = chip.dataset.type === 'all' ? null : chip.dataset.type;
                this.loadNotes();
            });
        });
    }

    applyNoteFilter(filterType) {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        
        switch(filterType) {
            case 'today':
                this.currentFilters.dateFrom = today.toISOString().split('T')[0];
                this.currentFilters.dateTo = today.toISOString().split('T')[0];
                break;
            case 'week':
                this.currentFilters.dateFrom = startOfWeek.toISOString().split('T')[0];
                this.currentFilters.dateTo = today.toISOString().split('T')[0];
                break;
            case 'starred':
                // This would require a 'starred' field in your database
                this.currentFilters.search = '★';
                break;
            case 'all':
            default:
                delete this.currentFilters.dateFrom;
                delete this.currentFilters.dateTo;
                delete this.currentFilters.search;
                break;
        }
        
        this.loadNotes();
    }

    switchSection(sectionName) {
        // Actualizar navegación
        document.querySelectorAll('.nav-item, .bottom-nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.section === sectionName) {
                item.classList.add('active');
            }
        });

        // Mostrar sección correspondiente
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        document.getElementById(`${sectionName}-section`).classList.add('active');

        // Si es la sección de símbolos, actualizar si es necesario
        if (sectionName === 'symbols') {
            this.updateSymbolsDisplay();
        }
    }

    setCurrentDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('note-date').value = today;
        document.getElementById('date-from').value = today;
        document.getElementById('date-to').value = today;
    }

    setupTheme() {
        const themeToggle = document.querySelector('.theme-toggle');
        const themeIcon = themeToggle.querySelector('i');
        
        // Check for saved theme preference
        const savedTheme = localStorage.getItem('astro-notes-theme');
        if (savedTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            themeIcon.className = 'fas fa-sun';
        }

        // System preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
        prefersDark.addEventListener('change', (e) => {
            if (!localStorage.getItem('astro-notes-theme')) {
                document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
            }
        });
    }

    toggleTheme() {
        const themeToggle = document.querySelector('.theme-toggle');
        const themeIcon = themeToggle.querySelector('i');
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        
        if (isDark) {
            document.documentElement.setAttribute('data-theme', 'light');
            themeIcon.className = 'fas fa-moon';
            localStorage.setItem('astro-notes-theme', 'light');
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            themeIcon.className = 'fas fa-sun';
            localStorage.setItem('astro-notes-theme', 'dark');
        }
    }

    loadSymbols() {
        // Cargar selector de tags
        this.loadTagsSelector();
        
        // Cargar filtro de tags
        this.loadTagsFilter();
        
        // Cargar símbolos
        this.loadSymbolsCategories();
        this.loadSymbolsGrid();
    }

loadTagsSelector() {
    const container = document.getElementById('tags-selector');
    const categories = this.getSymbolsByCategory();
    
    container.innerHTML = '';
    
    Object.entries(categories).forEach(([category, symbols]) => {
        // NO filtrar planetas astro aquí
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'category-group';
        categoryDiv.dataset.category = category;
        categoryDiv.innerHTML = `<h4>${category}</h4>`;
        
        const symbolsDiv = document.createElement('div');
        symbolsDiv.className = 'symbols-group';
        
        symbols.forEach(([name, data]) => {
            // NO filtrar planetas astro
            const tag = document.createElement('div');
            tag.className = 'tag';
            tag.dataset.name = name;
            tag.dataset.category = data.category;
            tag.dataset.font = data.font;
            tag.title = name;
            
            // Establecer color de fondo por categoría
            tag.style.backgroundColor = CATEGORY_COLORS[data.category] || CATEGORY_COLORS['Otros'];
            
            // Crear icono según la fuente
            if (data.font === 'astro') {
                tag.innerHTML = `<span class="astro">${data.symbol}</span>`;
            } else {
                tag.innerHTML = `<i class="${data.symbol}"></i>`;
            }
            
            tag.addEventListener('click', () => this.toggleTag(name));
            
            symbolsDiv.appendChild(tag);
        });
        
        categoryDiv.appendChild(symbolsDiv);
        container.appendChild(categoryDiv);
    });
}

loadTagsFilter() {
    const container = document.getElementById('tags-filter');
    
    // Limpiar el contenedor
    container.innerHTML = '';
    
    // Crear contenedor principal horizontal
    const horizontalContainer = document.createElement('div');
    horizontalContainer.className = 'tags-filter-horizontal';
    
    // Obtener todas las categorías y símbolos
    const categories = this.getSymbolsByCategory();
    
    // Para cada categoría, crear una sección
    Object.entries(categories).forEach(([category, symbols]) => {
        // Verificar si hay símbolos en esta categoría
        if (symbols.length === 0) return;
        
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'category-group-horizontal';
        categoryDiv.innerHTML = `<h4>${category}</h4>`;
        
        const symbolsDiv = document.createElement('div');
        symbolsDiv.className = 'symbols-group-horizontal';
        
        // Crear tags circulares para cada símbolo
        symbols.forEach(([name, data]) => {
            const tag = document.createElement('div');
            tag.className = 'tag';
            tag.dataset.name = name;
            tag.dataset.category = data.category;
            tag.dataset.font = data.font;
            tag.title = name;
            
            // Establecer color de fondo por categoría
            const color = CATEGORY_COLORS[data.category] || CATEGORY_COLORS['Otros'];
            tag.style.backgroundColor = color;
            
            // Crear icono según la fuente
            if (data.font === 'astro') {
                tag.innerHTML = `<span class="astro">${data.symbol}</span>`;
            } else {
                tag.innerHTML = `<i class="${data.symbol}"></i>`;
            }
            
            tag.addEventListener('click', () => {
                tag.classList.toggle('selected');
                this.updateFilterTags();
            });
            
            symbolsDiv.appendChild(tag);
        });
        
        categoryDiv.appendChild(symbolsDiv);
        horizontalContainer.appendChild(categoryDiv);
    });
    
    container.appendChild(horizontalContainer);
    
    // DEBUG: Ver qué categorías y símbolos se están cargando
    console.log("Categorías cargadas en filtros:", categories);
    console.log("Categoría 'Planetas':", categories['Planetas']);
}

    openTarotModal(cardName) {
        const card = this.findTarotCardByName(cardName);
        if (!card) return;
        
        const modal = document.getElementById('tarot-modal');
        document.getElementById('tarot-modal-title').textContent = card.Name;
        
        // Rellenar información de la carta
        document.getElementById('tarot-card-symbol').textContent = 
            ASTRO_SYMBOLS[card.Name]?.symbol || "🃏";
        document.getElementById('tarot-card-suit').textContent = card.Suit || "N/A";
        document.getElementById('tarot-card-type').textContent = card.Type || "N/A";
        document.getElementById('tarot-card-numerology').textContent = card.Numerology || "N/A";
        document.getElementById('tarot-card-planet').textContent = card.Planet || "N/A";
        document.getElementById('tarot-card-sign').textContent = card.Sign || "N/A";
        document.getElementById('tarot-card-element').textContent = card.Element || "N/A";
        document.getElementById('tarot-card-septenary').textContent = card.Septenary || "N/A";
        document.getElementById('tarot-card-vertical').textContent = card.Vertical || "N/A";
        
        // Cargar notas relacionadas
        this.loadRelatedNotes(cardName);
        
        // Cargar cartas similares
        this.loadSimilarCards(card);
        
        modal.style.display = 'flex';
    }

    findTarotCardByName(name) {
        return Object.values(tarotCards).find(card => card.Name === name);
    }

    async loadRelatedNotes(cardName) {
        const container = document.getElementById('tarot-related-notes');
        container.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><p>Cargando notas...</p></div>';
        
        try {
            const notes = await AstroNotesDB.getAllNotes({ tags: [cardName] });
            
            if (notes.length === 0) {
                container.innerHTML = '<p class="no-notes">No hay notas con esta carta</p>';
                return;
            }
            
            container.innerHTML = '';
            notes.forEach(note => {
                const noteItem = document.createElement('div');
                noteItem.className = 'related-note-item';
                noteItem.dataset.id = note.id;
                
                const preview = note.nota.length > 100 
                    ? note.nota.substring(0, 100) + '...'
                    : note.nota;
                
                noteItem.innerHTML = `
                    <div class="related-note-title">${note.title || 'Sin título'}</div>
                    <div class="related-note-preview">${preview}</div>
                `;
                
                noteItem.addEventListener('click', () => {
                    this.closeTarotModal();
                    this.openNoteModal(note.id);
                });
                
                container.appendChild(noteItem);
            });
        } catch (error) {
            console.error('Error cargando notas:', error);
            container.innerHTML = '<p class="error">Error al cargar notas</p>';
        }
    }

    loadSimilarCards(currentCard) {
        const container = document.getElementById('tarot-similar-cards');
        container.innerHTML = '';
        
        // Encontrar cartas con elementos similares
        const similarCards = Object.values(tarotCards).filter(card => {
            return card.ID !== currentCard.ID && (
                card.Element === currentCard.Element ||
                card.Planet === currentCard.Planet ||
                card.Type === currentCard.Type
            );
        }).slice(0, 5); // Limitar a 5 cartas similares
        
        if (similarCards.length === 0) {
            container.innerHTML = '<p>No hay cartas similares</p>';
            return;
        }
        
        similarCards.forEach(card => {
            const cardElement = document.createElement('div');
            cardElement.className = 'similar-card';
            cardElement.textContent = card.Name;
            
            cardElement.addEventListener('click', () => {
                this.openTarotModal(card.Name);
            });
            
            container.appendChild(cardElement);
        });
    }

    closeTarotModal() {
        document.getElementById('tarot-modal').style.display = 'none';
    }

    updateFilterTags() {
        // Obtener todos los tags seleccionados en los filtros
        const selectedTags = Array.from(document.querySelectorAll('#tags-filter .tag.selected'))
            .map(tag => tag.dataset.name);
        
        this.currentFilters.tags = selectedTags.length > 0 ? selectedTags : null;
        this.loadNotes();
    }

    clearFilters() {
        document.getElementById('search-filter').value = '';
        document.getElementById('date-from').value = '';
        document.getElementById('date-to').value = '';
        
        // Limpiar todos los tags seleccionados en los filtros
        document.querySelectorAll('#tags-filter .tag.selected').forEach(tag => {
            tag.classList.remove('selected');
        });
        
        // Reset notes filter chips too
        document.querySelectorAll('#notes-section .md-chip').forEach((chip, index) => {
            if (index === 0) {
                chip.classList.add('active');
            } else {
                chip.classList.remove('active');
            }
        });
        
        this.currentFilters = {};
        this.loadNotes();
    }

    loadSymbolsCategories() {
        const container = document.getElementById('symbol-categories');
        const categories = ['Todos', ...new Set(Object.values(ASTRO_SYMBOLS).map(s => s.category))];
        
        container.innerHTML = '';
        
        categories.forEach(category => {
            const chip = document.createElement('div');
            chip.className = `md-chip ${category === 'Todos' ? 'active' : ''}`;
            chip.textContent = category;
            chip.dataset.category = category;
            
            chip.addEventListener('click', () => {
                document.querySelectorAll('#symbol-categories .md-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                this.currentSymbolCategory = category;
                this.loadSymbolsGrid();
            });
            
            container.appendChild(chip);
        });
    }

// En el método loadSymbolsGrid, asegurar que use la lista correctamente:
loadSymbolsGrid() {
    const container = document.getElementById('symbols-grid');
    container.innerHTML = '';
    
    // Cambiar a contenedor de lista con grid interno
    const listContainer = document.createElement('div');
    listContainer.className = 'symbols-list';
    
    const symbols = Object.entries(ASTRO_SYMBOLS)
        .filter(([name, data]) => {
            return this.currentSymbolCategory === 'Todos' || data.category === this.currentSymbolCategory;
        })
        .slice(0, 50);
    
    symbols.forEach(([name, data]) => {
        const listItem = document.createElement('div');
        listItem.className = 'symbol-list-item';
        
        listItem.innerHTML = `
            <div class="symbol-list-icon ${data.font === 'astro' ? 'astro' : ''}">
                ${data.font === 'astro' ? data.symbol : `<i class="${data.symbol}"></i>`}
            </div>
            <div class="symbol-list-info">
                <div class="symbol-list-name" title="${name}">${name}</div>
                <div class="symbol-list-details">
                    <span class="symbol-list-category">${data.category}</span>
                </div>
            </div>
        `;
        
        listContainer.appendChild(listItem);
    });
    
    container.appendChild(listContainer);
}

    updateSymbolsDisplay() {
        this.loadSymbolsGrid();
    }

    getSymbolsByCategory() {
        const categories = {};
        
        Object.entries(ASTRO_SYMBOLS).forEach(([name, data]) => {
            if (!categories[data.category]) {
                categories[data.category] = [];
            }
            categories[data.category].push([name, data]);
        });
        
        return categories;
    }

    toggleTag(tagName) {
        if (this.selectedTags.has(tagName)) {
            this.selectedTags.delete(tagName);
        } else {
            this.selectedTags.add(tagName);
        }
        this.updateSelectedTagsDisplay();
    }

    addCustomTag(tagName) {
        if (!this.selectedTags.has(tagName)) {
            this.selectedTags.add(tagName);
            this.updateSelectedTagsDisplay();
        }
    }

    updateSelectedTagsDisplay() {
        const container = document.getElementById('selected-tags');
        container.innerHTML = '';
        
        this.selectedTags.forEach(tagName => {
            const symbolData = ASTRO_SYMBOLS[tagName];
            const tag = document.createElement('div');
            tag.className = 'tag';
            
            // Verificar si es una carta de tarot
            const isTarotCard = this.isTarotCard(tagName);
            
            if (isTarotCard) {
                // Etiqueta rectangular para cartas de tarot
                tag.className = 'tag tarot-card-tag';
                tag.dataset.category = 'Tarot';
                tag.style.backgroundColor = CATEGORY_COLORS['Tarot'] || CATEGORY_COLORS['Otros'];
                tag.innerHTML = `
                    <span class="tarot-card-name">${tagName}</span>
                    <button class="remove-tag" data-tag="${tagName}">
                        <i class="fas fa-times"></i>
                    </button>
                `;
            } else if (symbolData) {
                // Solo mostrar tags que NO son planetas astro
                if (!(symbolData.category === 'Planetas' && symbolData.font === 'astro')) {
                    tag.dataset.category = symbolData.category;
                    tag.dataset.font = symbolData.font;
                    tag.style.backgroundColor = CATEGORY_COLORS[symbolData.category] || CATEGORY_COLORS['Otros'];
                    
                    if (symbolData.font === 'astro') {
                        tag.innerHTML = `
                            <span class="astro">${symbolData.symbol}</span>
                        `;
                    } else {
                        tag.innerHTML = `<i class="${symbolData.symbol}"></i>`;
                    }
                    
                    tag.innerHTML += `
                        <button class="remove-tag" data-tag="${tagName}">
                            <i class="fas fa-times"></i>
                        </button>
                    `;
                } else {
                    // No mostrar planetas astro
                    return;
                }
            } else {
                // Para tags personalizados (sin símbolo)
                tag.style.backgroundColor = CATEGORY_COLORS['Otros'];
                tag.innerHTML = `
                    <span>${tagName.substring(0, 8)}${tagName.length > 8 ? '...' : ''}</span>
                    <button class="remove-tag" data-tag="${tagName}">
                        <i class="fas fa-times"></i>
                    </button>
                `;
            }
            
            tag.querySelector('.remove-tag')?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectedTags.delete(tagName);
                this.updateSelectedTagsDisplay();
            });
            
            if (tag.innerHTML) {
                container.appendChild(tag);
            }
        });
        
        // Actualizar opciones seleccionadas en el selector
        document.querySelectorAll('#tags-selector .tag').forEach(tag => {
            const tagName = tag.dataset.name;
            if (this.selectedTags.has(tagName)) {
                tag.classList.add('selected');
            } else {
                tag.classList.remove('selected');
            }
        });
    }

    async loadNotes() {
        const container = document.getElementById('notes-grid');
        container.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><p>Cargando notas...</p></div>';
        
        try {
            const notes = await AstroNotesDB.getAllNotesAndEntries(this.currentFilters);
            this.renderNotes(notes);
        } catch (error) {
            console.error('Error:', error);
        }
    }

createNoteCard(item) {
    const card = document.createElement('div');
    card.className = 'note-card';
    card.dataset.id = item.id;
    card.dataset.type = item.type;
    
    const fechaFormatted = item.date 
        ? new Date(item.date).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
        : 'Sin fecha';
    
    const preview = item.content && item.content.length > 150 
        ? item.content.substring(0, 150) + '...'
        : item.content || 'Sin contenido';
    
    // Badge para tipo de entrada
    const typeBadge = item.type === 'tarot' 
        ? `<div class="entry-type-badge tarot-badge">
              <i class="fa-solid fa-cat"></i> Arcana
           </div>`
        : `<div class="entry-type-badge note-badge">
              <i class="fas fa-book"></i> Nota
           </div>`;
    
    // Orientation badge (circular, mismo tamaño que tags)
    const orientationBadge = item.type === 'tarot' && item.orientation
        ? `<div class="tag orientation-tag ${item.orientation}-badge">
              <i class="fas fa-${item.orientation === 'upright' ? 'arrow-up' : 'arrow-down'}"></i>
           </div>`
        : '';
    
    // Generar tags HTML
    let tagsHTML = '';
    if (item.tags && item.tags.length > 0) {
        tagsHTML = '<div class="note-tags">';
        
        // Añadir orientation badge primero si existe
        if (orientationBadge) {
            tagsHTML += orientationBadge;
        }
        
        item.tags.forEach(tag => {
            const symbolData = ASTRO_SYMBOLS[tag];
            const isTarotCard = this.isTarotCard(tag);
            
            if (isTarotCard) {
                // Tarot card tag (circular, mismo tamaño)
                tagsHTML += `
                    <div class="tag tarot-card-tag-compact" 
                         data-category="Tarot"
                         style="background-color: ${CATEGORY_COLORS['Tarot']}">
                        <span class="tarot-card-name">${tag}</span>
                    </div>`;
            } else if (symbolData) {
                // Solo mostrar tags que NO son planetas astro
                if (!(symbolData.category === 'Planetas' && symbolData.font === 'astro')) {
                    tagsHTML += `
                        <div class="tag" 
                             data-category="${symbolData.category}"
                             data-font="${symbolData.font}"
                             style="background-color: ${CATEGORY_COLORS[symbolData.category] || CATEGORY_COLORS['Otros']}">
                            ${symbolData.font === 'astro' 
                                ? `<span class="astro">${symbolData.symbol}</span>`
                                : `<i class="${symbolData.symbol}"></i>`
                            }
                        </div>`;
                }
            } else {
                // Tags personalizados
                tagsHTML += `
                    <div class="tag" 
                         data-category="Otros"
                         style="background-color: ${CATEGORY_COLORS['Otros']}">
                        <span>${tag.substring(0, 2)}</span>
                    </div>`;
            }
        });
        
        tagsHTML += '</div>';
    } else if (orientationBadge) {
        // Si no hay tags pero sí orientation badge
        tagsHTML = `<div class="note-tags">${orientationBadge}</div>`;
    }
    
    card.innerHTML = `
        <div class="note-header">
            <div class="note-header-top">
                <h3 class="note-title">${item.title}</h3>
                ${typeBadge}
            </div>
            
        </div>
        <div class="note-date">${fechaFormatted}</div>
        <div class="note-content">${preview}</div>
        ${tagsHTML}
    `;
    
    card.addEventListener('click', () => {
        if (item.type === 'tarot') {
            this.openTarotEntryModal(item);
        } else {
            this.openNoteModal(item.id.replace('note-', ''));
        }
    });
    
    return card;
}

    openTarotEntryModal(item) {
        const modal = document.getElementById('note-modal');
        const fechaFormatted = item.date 
            ? new Date(item.date).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
            : 'Sin fecha';
        
        const createdFormatted = new Date(item.created_at).toLocaleString('es-ES');
        
        let tagsHTML = '';
        if (item.tags && item.tags.length > 0) {
            tagsHTML = '<div class="note-tags">';
            item.tags.forEach(tag => {
                const symbolData = ASTRO_SYMBOLS[tag];
                
                // Verificar si es una carta de tarot
                const isTarotCard = this.isTarotCard(tag);
                
                if (isTarotCard) {
                    // Etiqueta rectangular para cartas de tarot
                    tagsHTML += `
                        <div class="tag tarot-card-tag" 
                             data-category="Tarot"
                             style="background-color: ${CATEGORY_COLORS['Tarot']}">
                            <span class="tarot-card-name">${tag}</span>
                        </div>`;
                } else if (symbolData) {
                    // Solo mostrar tags que NO son planetas astro
                    if (!(symbolData.category === 'Planetas' && symbolData.font === 'astro')) {
                        tagsHTML += `
                            <div class="tag" 
                                 data-category="${symbolData.category}"
                                 data-font="${symbolData.font}"
                                 style="background-color: ${CATEGORY_COLORS[symbolData.category] || CATEGORY_COLORS['Otros']}">
                                ${symbolData.font === 'astro' 
                                    ? `<span class="astro">${symbolData.symbol}</span>`
                                    : `<i class="${symbolData.symbol}"></i>`
                                }
                            </div>`;
                    }
                } else {
                    tagsHTML += `
                        <div class="tag" 
                             data-category="Otros"
                             style="background-color: ${CATEGORY_COLORS['Otros']}">
                            <span>${tag}</span>
                        </div>`;
                }
            });
            tagsHTML += '</div>';
        }
        
        // Información de la carta de tarot
        let tarotInfoHTML = '';
        if (item.tarot_card) {
            const card = item.tarot_card;
        }
        
        document.getElementById('modal-note-title').textContent = item.title;
        document.getElementById('modal-note-date').textContent = `Fecha: ${fechaFormatted}`;
        document.getElementById('modal-note-tags').innerHTML = tagsHTML;
        document.getElementById('modal-note-content').innerHTML = `
            <div class="tarot-entry-content">
                <h4>Notas:</h4>
                <p>${item.content || 'Sin notas'}</p>
                ${tarotInfoHTML}
            </div>
        `;
        document.getElementById('modal-note-created').textContent = `Creada: ${createdFormatted}`;
        
        // Ocultar botones de editar/eliminar para entradas de tarot (ya que son de solo lectura)
        document.getElementById('edit-note').style.display = 'none';
        document.getElementById('delete-note').style.display = 'none';
        
        modal.style.display = 'flex';
    }

    // En openNoteModal, restaurar los botones para notas normales:
    async openNoteModal(id) {
        const note = await AstroNotesDB.getNoteById(id);
        if (!note) return;
        
        this.currentNoteId = id;
        
        const modal = document.getElementById('note-modal');
        const fechaFormatted = note.fecha 
            ? new Date(note.fecha).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
            : 'Sin fecha';
        
        const createdFormatted = new Date(note.created_at).toLocaleString('es-ES');
        
        let tagsHTML = '';
        if (note.tags && note.tags.length > 0) {
            tagsHTML = '<div class="note-tags">';
            note.tags.forEach(tag => {
                const symbolData = ASTRO_SYMBOLS[tag];
                
                // Verificar si es una carta de tarot
                const isTarotCard = this.isTarotCard(tag);
                
                if (isTarotCard) {
                    // Etiqueta rectangular para cartas de tarot
                    tagsHTML += `
                        <div class="tag tarot-card-tag" 
                             data-category="Tarot"
                             style="background-color: ${CATEGORY_COLORS['Tarot']}">
                            <span class="tarot-card-name">${tag}</span>
                        </div>`;
                } else if (symbolData) {
                    // Solo mostrar tags que NO son planetas astro
                    if (!(symbolData.category === 'Planetas' && symbolData.font === 'astro')) {
                        tagsHTML += `
                            <div class="tag" 
                                 data-category="${symbolData.category}"
                                 data-font="${symbolData.font}"
                                 style="background-color: ${CATEGORY_COLORS[symbolData.category] || CATEGORY_COLORS['Otros']}">
                                ${symbolData.font === 'astro' 
                                    ? `<span class="astro">${symbolData.symbol}</span>`
                                    : `<i class="${symbolData.symbol}"></i>`
                                }
                            </div>`;
                    }
                } else {
                    tagsHTML += `
                        <div class="tag" 
                             data-category="Otros"
                             style="background-color: ${CATEGORY_COLORS['Otros']}">
                            <span>${tag}</span>
                        </div>`;
                }
            });
            tagsHTML += '</div>';
        }
        
        document.getElementById('modal-note-title').textContent = note.title || 'Sin título';
        document.getElementById('modal-note-date').textContent = `Fecha: ${fechaFormatted}`;
        document.getElementById('modal-note-tags').innerHTML = tagsHTML;
        document.getElementById('modal-note-content').textContent = note.nota;
        document.getElementById('modal-note-created').textContent = `Creada: ${createdFormatted}`;
        
        // Mostrar botones para notas normales
        document.getElementById('edit-note').style.display = 'inline-flex';
        document.getElementById('delete-note').style.display = 'inline-flex';
        
        modal.style.display = 'flex';
    }

    renderNotes(items) {
        const container = document.getElementById('notes-grid');
        
        if (items.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-book fa-3x"></i>
                    <h3>No hay notas</h3>
                    <p>Comienza creando tu primera nota</p>
                    <button class="md-filled-button" id="create-first-note">
                        <i class="fas fa-plus"></i>
                        Crear primera nota
                    </button>
                </div>
            `;
            
            document.getElementById('create-first-note')?.addEventListener('click', () => {
                this.switchSection('new-note');
            });
            
            return;
        }
        
        container.innerHTML = '';
        
        items.forEach(item => {
            const card = this.createNoteCard(item);
            container.appendChild(card);
        });
    }

    closeModal() {
        document.getElementById('note-modal').style.display = 'none';
        this.currentNoteId = null;
        
        // Restaurar botones por defecto
        document.getElementById('edit-note').style.display = 'inline-flex';
        document.getElementById('delete-note').style.display = 'inline-flex';
    }

    async saveNote() {
        const formData = {
            fecha: document.getElementById('note-date').value,
            nota: document.getElementById('note-content').value,
            title: document.getElementById('note-title').value || null,
            tags: Array.from(this.selectedTags)
        };
        
        try {
            if (this.currentNoteId) {
                await AstroNotesDB.updateNote(this.currentNoteId, formData);
            } else {
                await AstroNotesDB.createNote(formData);
            }
            
            this.clearForm();
            this.loadNotes();
            this.switchSection('notes');
            this.closeModal();
        } catch (error) {
            console.error('Error al guardar nota:', error);
        }
    }

    clearForm() {
        document.getElementById('note-form').reset();
        this.setCurrentDate();
        this.selectedTags.clear();
        this.updateSelectedTagsDisplay();
        this.currentNoteId = null;
    }

    applyFilters() {
        const dateFrom = document.getElementById('date-from').value;
        const dateTo = document.getElementById('date-to').value;
        
        this.currentFilters.dateFrom = dateFrom || null;
        this.currentFilters.dateTo = dateTo || null;
        
        this.loadNotes();
        this.switchSection('notes');
    }

    editNote() {
        if (!this.currentNoteId) return;
        
        AstroNotesDB.getNoteById(this.currentNoteId).then(note => {
            if (!note) return;
            
            document.getElementById('note-title').value = note.title || '';
            document.getElementById('note-date').value = note.fecha || new Date().toISOString().split('T')[0];
            document.getElementById('note-content').value = note.nota || '';
            
            this.selectedTags = new Set(note.tags || []);
            this.updateSelectedTagsDisplay();
            
            this.closeModal();
            this.switchSection('new-note');
            document.getElementById('note-title').focus();
        });
    }

    async deleteNote() {
        if (!this.currentNoteId || !confirm('¿Estás seguro de que quieres eliminar esta nota?')) {
            return;
        }
        
        try {
            await AstroNotesDB.deleteNote(this.currentNoteId);
            this.loadNotes();
            this.closeModal();
        } catch (error) {
            console.error('Error al eliminar nota:', error);
        }
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.app = new AstroNotesApp();
});
