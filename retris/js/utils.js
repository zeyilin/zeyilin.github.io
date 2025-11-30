// utils.js - Helper Functions

/**
 * Clamp a number between min and max values
 */
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * Format a number with locale-specific separators
 */
function formatNumber(num) {
    return num.toLocaleString();
}

/**
 * Get a random integer between min (inclusive) and max (exclusive)
 */
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

/**
 * Debounce a function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle a function
 */
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Deep clone an array (for 2D arrays like tetromino shapes)
 */
function deepClone(arr) {
    return JSON.parse(JSON.stringify(arr));
}

/**
 * Check if device is mobile
 */
function isMobile() {
    return window.innerWidth <= 768 || 'ontouchstart' in window;
}

/**
 * Check if device prefers reduced motion
 */
function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Generate a unique ID
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Sanitize a string for display (prevent XSS)
 */
function sanitize(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Get CSS variable value
 */
function getCSSVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/**
 * Set CSS variable value
 */
function setCSSVar(name, value) {
    document.documentElement.style.setProperty(name, value);
}

