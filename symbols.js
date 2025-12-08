
const CATEGORY_COLORS = {
    'Elementos': '#FF6B6B',    // Rojo neobrutalista
    'Planetas': '#F9BC60',     // Naranja/amarillo
    'Signos': '#ABD1C6',       // Verde primario
    'Tarot': '#E16162',        // Rojo coral
    'Numerología': '#7A7AFF',  // Azul
    'Casas': '#FF8E00',        // Naranja oscuro
    'Aspectos': '#00B894',     // Verde esmeralda
    'Otros': '#6C5CE7'         // Púrpura
};

// Sistema de símbolos astrológicos
const ASTRO_SYMBOLS = {
    // Elementos
    'Fire': { 
        symbol: '±', 
        category: 'Elementos',
        font: 'astro'
    },
    'Water': { 
        symbol: '³', 
        category: 'Elementos',
        font: 'astro'
    },
    'Air': { 
        symbol: '²', 
        category: 'Elementos',
        font: 'astro'
    },
    'Earth': { 
        symbol: '´', 
        category: 'Elementos',
        font: 'astro'
    },
    
    // Planetas
    'Sun': { 
        symbol: 'Q', 
        category: 'Planetas',
        font: 'astro'
    },
    'Moon': { 
        symbol: 'R', 
        category: 'Planetas',
        font: 'astro'
    },
    'Mercury': { 
        symbol: 'S', 
        category: 'Planetas',
        font: 'astro'
    },
    'Mars': { 
        symbol: 'U', 
        category: 'Planetas',
        font: 'astro'
    },
    'Jupiter': { 
        symbol: 'V', 
        category: 'Planetas',
        font: 'astro'
    },
    'Saturn': { 
        symbol: 'W', 
        category: 'Planetas',
        font: 'astro'
    },
    'Neptune': { 
        symbol: 'X', 
        category: 'Planetas',
        font: 'astro'
    },
    'Uranus': { 
        symbol: 'Y', 
        category: 'Planetas',
        font: 'astro'
    },
    'Pluto': { 
        symbol: 'Z', 
        category: 'Planetas',
        font: 'astro'
    },
    
    // Signos zodiacales
    'Aries': { 
        symbol: 'A', 
        category: 'Signos',
        font: 'astro'
    },
    'Leo': { 
        symbol: 'E', 
        category: 'Signos',
        font: 'astro'
    },
    'Virgo': { 
        symbol: 'F', 
        category: 'Signos',
        font: 'astro'
    },
    'Libra': { 
        symbol: 'G', 
        category: 'Signos',
        font: 'astro'
    },
    'Taurus': { 
        symbol: 'B', 
        category: 'Signos',
        font: 'astro'
    },
    'Gemini': { 
        symbol: 'C', 
        category: 'Signos',
        font: 'astro'
    },
    'Cancer': { 
        symbol: 'D', 
        category: 'Signos',
        font: 'astro'
    },
    'Scorpio': { 
        symbol: 'H', 
        category: 'Signos',
        font: 'astro'
    },
    'Sagittarius': { 
        symbol: 'I', 
        category: 'Signos',
        font: 'astro'
    },
    'Capricorn': { 
        symbol: 'J', 
        category: 'Signos',
        font: 'astro'
    },
    'Aquarius': { 
        symbol: 'K', 
        category: 'Signos',
        font: 'astro'
    },
    'Pisces': { 
        symbol: 'L', 
        category: 'Signos',
        font: 'astro'
    },
    
    // Tipos de cartas
    'Majors': { 
        symbol: 'fas fa-crown', 
        category: 'Tarot',
        font: 'fa'
    },
    'Minors': { 
        symbol: 'fas fa-chess-pawn', 
        category: 'Tarot',
        font: 'fa'
    },
    'Court': { 
        symbol: 'fas fa-chess-rook', 
        category: 'Tarot',
        font: 'fa'
    },
    
    // Figuras de la corte
    'Pages': { 
        symbol: 'fas fa-chess-bishop', 
        category: 'Tarot',
        font: 'fa'
    },
    'Knights': { 
        symbol: 'fas fa-chess-knight', 
        category: 'Tarot',
        font: 'fa'
    },
    'Queens': { 
        symbol: 'fas fa-chess-queen', 
        category: 'Tarot',
        font: 'fa'
    },
    'Kings': { 
        symbol: 'fas fa-chess-king', 
        category: 'Tarot',
        font: 'fa'
    },

    'Pentacles': { 
        symbol: 'fa-solid fa-tree', 
        category: 'Otros',
        font: 'fa'
    },
    'Cups': { 
        symbol: 'fa-solid fa-water', 
        category: 'Otros',
        font: 'fa'
    },

    'Swords': { 
        symbol: 'fa-solid fa-wind', 
        category: 'Otros',
        font: 'fa'
    },
    'Wands': { 
        symbol: 'fa-solid fa-fire', 
        category: 'Otros',
        font: 'fa'
    },
    
    // Casas astrológicas
    'Casa 1': { 
        symbol: '1', 
        category: 'Casas',
        font: 'astro'
    },
    'Casa 2': { 
        symbol: '2', 
        category: 'Casas',
        font: 'astro'
    },
    'Casa 3': { 
        symbol: '3', 
        category: 'Casas',
        font: 'astro'
    },
    'Casa 4': { 
        symbol: '4', 
        category: 'Casas',
        font: 'astro'
    },
    'Casa 5': { 
        symbol: '5', 
        category: 'Casas',
        font: 'astro'
    },
    'Casa 6': { 
        symbol: '6', 
        category: 'Casas',
        font: 'astro'
    },
    'Casa 7': { 
        symbol: '7', 
        category: 'Casas',
        font: 'astro'
    },
    'Casa 8': { 
         symbol: '8', 
        category: 'Casas',
        font: 'astro'
    },
    'Casa 9': { 
        symbol: '9', 
        category: 'Casas',
        font: 'astro'
    },
    'Casa 10': { 
        symbol: '10', 
        category: 'Casas',
        font: 'astro'
    },
    'Casa 11': { 
        symbol: '11', 
        category: 'Casas',
        font: 'astro'
    },
    'Casa 12': { 
        symbol: '12', 
        category: 'Casas',
        font: 'astro'
    },
    
    // Aspectos astrológicos
    'Conjunción': { 
        symbol: '!', 
        category: 'Aspectos',
        font: 'astro'
    },
    'Oposición': { 
        symbol: '"', 
        category: 'Aspectos',
        font: 'astro'
    },
    'Trígono': { 
        symbol: '$', 
        category: 'Aspectos',
        font: 'astro'
    },
    'Cuadratura': { 
        symbol: '#', 
        category: 'Aspectos',
        font: 'astro'
    },
    'Sextil': { 
        symbol: '%', 
        category: 'Aspectos',
        font: 'astro'
    },

    
    'Tarot': { 
        symbol: 'fa-solid fa-t', 
        category: 'Otros',
        font: 'fa'
    },
    'Astro': { 
        symbol: 'fa-solid fa-a', 
        category: 'Otros',
        font: 'fa'
    },

};
