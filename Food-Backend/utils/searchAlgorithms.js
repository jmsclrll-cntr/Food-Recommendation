/**
 * extractUniqueIngredients
 * Iterates through a collection of foods, parses their ingredients list
 * (supporting comma-delimited strings, stringified JSON arrays, or native arrays),
 * standardizes the format, filters out duplicate items, and returns a sorted unique list.
 * 
 * @param {Array} foods - List of food items from Firestore
 * @returns {Array} List of unique, standardized ingredients
 */
function extractUniqueIngredients(foods) {
    if (!Array.isArray(foods)) return [];

    const uniqueSet = new Set();

    foods.forEach(food => {
        const ing = food.ingredients;
        if (!ing) return;

        let parsedList = [];
        if (Array.isArray(ing)) {
            parsedList = ing;
        } else if (typeof ing === 'string') {
            const trimmed = ing.trim();
            if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                try {
                    parsedList = JSON.parse(trimmed);
                } catch (e) {
                    parsedList = ing.split(',').map(x => x.trim());
                }
            } else {
                parsedList = ing.split(',').map(x => x.trim());
            }
        }

        parsedList.forEach(item => {
            if (item && typeof item === 'string') {
                const clean = item.trim();
                if (clean.length > 0) {
                    // Standardize to Title Case (e.g., "tofu" or "TOFU" -> "Tofu")
                    const titleCased = clean
                        .toLowerCase()
                        .split(' ')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ');
                    uniqueSet.add(titleCased);
                }
            }
        });
    });

    // Return as a sorted array
    return Array.from(uniqueSet).sort((a, b) => a.localeCompare(b));
}

/**
 * sequentialSearch (Linear Search Algorithm)
 * Sequentially iterates through the list of ingredients to find matches
 * containing the case-insensitive search query.
 * 
 * Time Complexity: O(N) where N is the number of unique ingredients.
 * Space Complexity: O(M) where M is the number of matching ingredients found.
 * 
 * @param {Array} items - List of unique ingredients (strings)
 * @param {string} query - The search pattern entered by the user
 * @returns {Array} Filtered list of matching ingredients
 */
function sequentialSearch(items, query) {
    if (!Array.isArray(items)) return [];
    if (!query || typeof query !== 'string' || query.trim() === '') return items;

    const normalizedQuery = query.toLowerCase().trim();
    const results = [];

    // Classic Sequential/Linear Search loop
    for (let i = 0; i < items.length; i++) {
        const currentItem = items[i];
        if (currentItem.toLowerCase().includes(normalizedQuery)) {
            results.push(currentItem);
        }
    }

    return results;
}

module.exports = {
    extractUniqueIngredients,
    sequentialSearch
};
