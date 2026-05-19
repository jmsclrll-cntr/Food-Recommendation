// ml/utils.js

const ACTIVITY_MULTIPLIERS = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9
};

exports.getBmiCategory = (bmi) => {
    const numericBmi = parseFloat(bmi);
    if (numericBmi < 18.5) return "Underweight";
    if (numericBmi < 25) return "Normal";
    if (numericBmi < 30) return "Overweight";
    return "Obese";
};

exports.calculateBmr = (weight, height, age, gender) => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    const a = parseFloat(age);
    if (isNaN(w) || isNaN(h) || isNaN(a)) return 0;
    
    let bmr = (10 * w) + (6.25 * h) - (5 * a);
    if (gender?.toLowerCase() === 'male') {
        bmr += 5;
    } else {
        bmr -= 161;
    }
    return Math.round(bmr);
};

exports.calculateTdee = (weight, height, age, gender, activity) => {
    const bmr = exports.calculateBmr(weight, height, age, gender);
    if (bmr === 0) return 0;
    const multiplier = ACTIVITY_MULTIPLIERS[activity?.toLowerCase()] || 1.3;
    return Math.round(bmr * multiplier);
};

exports.calculateTargetCalories = (bmi, gender, goal, weight, height, age, activity) => {
    // If advanced biometrics are provided, use Mifflin-St Jeor equation
    if (weight && height && age) {
        const tdee = exports.calculateTdee(weight, height, age, gender, activity);
        let target = tdee;
        if (goal?.toLowerCase() === 'lose') {
            target = tdee - 500;
        } else if (goal?.toLowerCase() === 'gain') {
            target = tdee + 500;
        }
        return Math.round(target);
    }

    // Baseline fallback
    let base = (gender?.toLowerCase() === 'male') ? 2200 : 1800;
    if (goal?.toLowerCase() === 'lose') {
        base -= 500;
    } else if (goal?.toLowerCase() === 'gain') {
        base += 500;
    }
    return Math.round(base);
};