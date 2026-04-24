/**
 * KEY / LEGEND:
 * Target: lose: 0, gain: 1, maintain: 2
 * Condition: none: 0, diabetes: 1, hypertension: 2, heart disease: 3
 * 
 * DIET LABELS (Output): 
 * 0: Low Carb (Weight Loss focus)
 * 1: High Protein (Muscle/Gain/Maintenance focus)
 * 2: Low Sugar (Medical: Diabetes focus)
 * 3: Low Sodium (Medical: Heart/Blood Pressure focus)
 */

const dataset = [
    // --- CATEGORY: NO CONDITIONS (Focus on BMI and Target) ---
    // Target: Lose (0) -> Recommendation: Low Carb (0)
    [150, 70, 0, 0], [155, 75, 0, 0], [160, 80, 0, 0], [165, 85, 0, 0], [170, 90, 0, 0],
    [175, 95, 0, 0], [180, 100, 0, 0], [185, 105, 0, 0], [190, 110, 0, 0], [160, 95, 0, 0],
    [155, 85, 0, 0], [170, 110, 0, 0], [175, 120, 0, 0], [180, 130, 0, 0], [165, 90, 0, 0],

    // Target: Gain (1) -> Recommendation: High Protein (1)
    [150, 40, 1, 0], [155, 45, 1, 0], [160, 50, 1, 0], [165, 55, 1, 0], [170, 60, 1, 0],
    [175, 65, 1, 0], [180, 70, 1, 0], [185, 75, 1, 0], [190, 80, 1, 0], [160, 45, 1, 0],
    [155, 40, 1, 0], [170, 55, 1, 0], [175, 60, 1, 0], [180, 65, 1, 0], [165, 50, 1, 0],

    // Target: Maintain (2) -> Recommendation: High Protein (1)
    [160, 60, 2, 0], [165, 65, 2, 0], [170, 70, 2, 0], [175, 75, 2, 0], [180, 80, 2, 0],
    [155, 55, 2, 0], [185, 85, 2, 0], [190, 90, 2, 0], [172, 72, 2, 0], [168, 68, 2, 0],

    // --- CATEGORY: DIABETES (Condition: 1) ---
    // Rule: Regardless of Target/BMI, sugar must be restricted.
    // Result: Low Sugar (2)
    [150, 80, 0, 1], [160, 85, 0, 1], [170, 90, 0, 1], [180, 95, 0, 1], [190, 100, 0, 1],
    [155, 50, 1, 1], [165, 55, 1, 1], [175, 60, 1, 1], [185, 65, 1, 1], [160, 65, 2, 1],
    [170, 75, 2, 1], [180, 85, 2, 1], [162, 82, 0, 1], [175, 88, 0, 1], [168, 70, 2, 1],
    [150, 45, 1, 1], [158, 78, 0, 1], [182, 92, 0, 1], [160, 62, 2, 1], [177, 84, 0, 1],

    // --- CATEGORY: HYPERTENSION (Condition: 2) ---
    // Rule: Sodium restriction is priority.
    // Result: Low Sodium (3)
    [150, 85, 0, 2], [160, 90, 0, 2], [170, 95, 0, 2], [180, 100, 0, 2], [190, 105, 0, 2],
    [155, 45, 1, 2], [165, 50, 1, 2], [175, 55, 1, 2], [185, 60, 1, 2], [160, 70, 2, 2],
    [170, 80, 2, 2], [180, 90, 2, 2], [158, 88, 0, 2], [172, 92, 0, 2], [166, 75, 2, 2],
    [152, 48, 1, 2], [178, 98, 0, 2], [185, 110, 0, 2], [160, 58, 1, 2], [170, 72, 2, 2],

    // --- CATEGORY: HEART DISEASE (Condition: 3) ---
    // Rule: Heart health / Low Sodium / Low Saturated Fat.
    // Result: Low Sodium (3)
    [150, 90, 0, 3], [160, 95, 0, 3], [170, 100, 0, 3], [180, 105, 0, 3], [190, 110, 0, 3],
    [155, 50, 1, 3], [165, 55, 1, 3], [175, 60, 1, 3], [185, 65, 1, 3], [160, 75, 2, 3],
    [170, 85, 2, 3], [180, 95, 2, 3], [158, 82, 0, 3], [172, 85, 0, 3], [166, 68, 2, 3],
];

const labels = [
    // No condition, Lose -> Low Carb (0)
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    // No condition, Gain -> High Protein (1)
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    // No condition, Maintain -> High Protein (1)
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    // Diabetes -> Low Sugar (2)
    2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
    // Hypertension -> Low Sodium (3)
    3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
    // Heart Disease -> Low Sodium (3)
    3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3
];

module.exports = { dataset, labels };