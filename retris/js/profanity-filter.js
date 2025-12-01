// profanity-filter.js - Offensive Word Filtering

class ProfanityFilter {
    constructor() {
        // Common offensive words and variations
        // Using a basic list - can be expanded
        this.badWords = [
            // Explicit profanity
            'fuck', 'fucking', 'fucked', 'fucker',
            'shit', 'shitting', 'shitted', 'shitter',
            'ass', 'asshole', 'asses',
            'bitch', 'bitches', 'bitching',
            'damn', 'damned', 'damnit',
            'hell', 'hells',
            'crap', 'crappy',
            'piss', 'pissing', 'pissed',
            'dick', 'dicks', 'dickhead',
            'cock', 'cocks',
            'pussy', 'pussies',
            'bastard', 'bastards',
            'slut', 'sluts',
            'whore', 'whores',
            // Hate speech
            'nazi', 'nazis',
            'kkk',
            // Other offensive terms
            'retard', 'retarded', 'retards',
            'gay', 'gays', // Context-dependent, but filtering for safety
            'lesbian', 'lesbians',
            // Variations with numbers/leetspeak (removed * variations - they cause regex issues)
            'f4ck', 'fuck1ng',
            'sh1t',
            'a$$', 'a55', '4ss',
            'b1tch',
            'd1ck',
        ];
        
        // Create regex patterns for word boundaries
        this.patterns = this.badWords.map(word => {
            // Escape special regex characters first (including * which causes issues)
            let escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            
            // Apply leetspeak substitutions - need to handle escaped characters
            // Replace escaped letters with character classes
            escapedWord = escapedWord
                .replace(/\\a/gi, '[a4@]')
                .replace(/\\e/gi, '[e3]')
                .replace(/\\i/gi, '[i1!]')
                .replace(/\\o/gi, '[o0]')
                .replace(/\\s/gi, '[s5$]')
                .replace(/\\t/gi, '[t7]')
                .replace(/\\l/gi, '[l1]');
            
            try {
                return new RegExp(`\\b${escapedWord}\\b`, 'gi');
            } catch (e) {
                // If regex creation fails, use a simple escaped version
                const simpleEscaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                return new RegExp(`\\b${simpleEscaped}\\b`, 'gi');
            }
        });
    }
    
    /**
     * Check if text contains offensive words
     */
    containsProfanity(text) {
        if (!text || typeof text !== 'string') return false;
        
        const lowerText = text.toLowerCase();
        
        // Check against patterns
        for (const pattern of this.patterns) {
            if (pattern.test(text)) {
                return true;
            }
        }
        
        // Also check for common bypass attempts
        const normalized = text.toLowerCase().replace(/[^a-z0-9]/g, '');
        for (const word of this.badWords) {
            if (normalized.includes(word.toLowerCase())) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Filter offensive words from text - replaces with asterisks
     */
    filter(text) {
        if (!text || typeof text !== 'string') return text;
        
        let filtered = text;
        
        // First, handle leetspeak and character substitutions
        // Normalize common substitutions before pattern matching
        const normalized = filtered
            .replace(/[4@]/gi, 'a')
            .replace(/[3]/gi, 'e')
            .replace(/[1!]/gi, 'i')
            .replace(/[0]/gi, 'o')
            .replace(/[5$]/gi, 's')
            .replace(/[7]/gi, 't');
        
        // Check normalized version against bad words
        for (const word of this.badWords) {
            const wordPattern = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
            if (wordPattern.test(normalized)) {
                // Find and replace in original text (preserving case)
                const originalPattern = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
                filtered = filtered.replace(originalPattern, (match) => {
                    return '*'.repeat(match.length);
                });
            }
        }
        
        // Also use regex patterns for more complex matching
        for (const pattern of this.patterns) {
            filtered = filtered.replace(pattern, (match) => {
                return '*'.repeat(match.length);
            });
        }
        
        // Handle bypass attempts (words without spaces)
        const words = filtered.split(/\s+/);
        const filteredWords = words.map(word => {
            const normalizedWord = word.toLowerCase().replace(/[^a-z0-9]/g, '');
            for (const badWord of this.badWords) {
                if (normalizedWord.includes(badWord.toLowerCase())) {
                    return '*'.repeat(word.length);
                }
            }
            return word;
        });
        
        return filteredWords.join(' ');
    }
    
    /**
     * Sanitize name - always filters offensive words, never rejects
     * Offensive words are replaced with asterisks before saving
     */
    sanitizeName(name) {
        if (!name) return '';
        
        const trimmed = name.trim();
        
        // Always filter and return sanitized version
        // Never reject - just replace offensive words with asterisks
        const filtered = this.filter(trimmed);
        
        // If the entire name was filtered out, provide a default
        if (filtered.trim().length === 0 || filtered.replace(/\*/g, '').trim().length === 0) {
            return 'Player';
        }
        
        return filtered;
    }
}

