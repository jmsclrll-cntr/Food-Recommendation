// Food-Backend/ml/utils.js
const getBmiCategory = (bmi) => {
    const val = parseFloat(bmi);
    if (isNaN(val) || val === 0) return 'unknown';
    if (val < 18.5) return 'underweight';
    if (val >= 18.5 && val < 25) return 'normal';
    if (val >= 25 && val < 30) return 'overweight';
    return 'obese';
};

// Siguraduhin na naka-export bilang object property
module.exports = { getBmiCategory };