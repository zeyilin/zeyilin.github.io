// storage.js - High Score Storage

class Storage {
    constructor() {
        this.STORAGE_KEY = 'retris_highscores';
        this.INSTRUCTIONS_KEY = 'retris_instructions_shown';
        this.profanityFilter = new ProfanityFilter();
    }
    
    /**
     * Get all stored high scores
     */
    getScores() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.warn('Could not read from localStorage:', e);
            return [];
        }
    }
    
    /**
     * Save a new score
     */
    saveScore(name, score, level) {
        // Filter offensive words - replaces them with asterisks instead of rejecting
        const sanitizedName = this.profanityFilter.sanitizeName(name);
        
        // Ensure we have a valid name (fallback to "Player" if all filtered)
        const finalName = sanitize(sanitizedName.slice(0, 12)) || 'Player';
        
        const newScore = {
            id: generateId(),
            name: finalName,
            score,
            level,
            date: new Date().toISOString()
        };
        
        const scores = this.getScores();
        scores.push(newScore);
        scores.sort((a, b) => b.score - a.score);
        
        // Keep top 10
        const topScores = scores.slice(0, 10);
        
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(topScores));
        } catch (e) {
            console.warn('Could not save to localStorage:', e);
        }
        
        return topScores;
    }
    
    /**
     * Check if a score qualifies for the high score list
     */
    isHighScore(score) {
        const scores = this.getScores();
        if (scores.length < 10) return score > 0;
        return score > scores[scores.length - 1].score;
    }
    
    /**
     * Get the rank a score would have
     */
    getRank(score) {
        const scores = this.getScores();
        let rank = 1;
        for (const s of scores) {
            if (score > s.score) break;
            rank++;
        }
        return rank;
    }
    
    /**
     * Clear all scores
     */
    clearScores() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
        } catch (e) {
            console.warn('Could not clear localStorage:', e);
        }
    }
    
    /**
     * Get the highest score
     */
    getHighestScore() {
        const scores = this.getScores();
        return scores.length > 0 ? scores[0].score : 0;
    }
    
    /**
     * Check if instructions have been shown
     */
    hasSeenInstructions() {
        try {
            return localStorage.getItem(this.INSTRUCTIONS_KEY) === 'true';
        } catch (e) {
            return false;
        }
    }
    
    /**
     * Mark instructions as shown
     */
    markInstructionsShown() {
        try {
            localStorage.setItem(this.INSTRUCTIONS_KEY, 'true');
        } catch (e) {
            console.warn('Could not save instructions status:', e);
        }
    }
}

