// ml/utils.js

exports.getBmiCategory = (bmi) => {
    const numericBmi = parseFloat(bmi);
    if (numericBmi < 18.5) return "Underweight";
    if (numericBmi < 25) return "Normal";
    if (numericBmi < 30) return "Overweight";
    return "Obese";
};

exports.calculateTargetCalories = (bmi, gender, goal) => {
    // 1. Set a baseline (Standard average)
    // We use lowercase to avoid errors with "Male" vs "male"
    let base = (gender?.toLowerCase() === 'male') ? 2200 : 1800;

    // 2. Normalize the goal string to lowercase
    const userGoal = goal?.toLowerCase();

    // 3. Adjust based on Goal
    if (userGoal === 'lose weight') {
        base -= 500;
    } else if (userGoal === 'gain weight') {
        base += 500;
    } else {
        // This covers 'maintain' or any empty input
        base = base; 
    }

    // 4. BMI Specific Adjustment (Bonus Logic)
    // If someone is Obese but wants to 'maintain', we should still 
    // slightly lower their calories for health safety.
    const category = this.getBmiCategory(bmi);
    if (category === "Obese" && userGoal === "maintain") {
        base -= 200; 
    }

    return Math.round(base);
};