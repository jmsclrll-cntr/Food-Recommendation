const { findMostFrequentGoal } = require('../ml/mlDataService');

exports.getSuggestion = (req, res) => {
    try {
        
        const { gender, bmi } = req.query;

        if (!gender || !bmi) {
            return res.status(400).json({ error: "Missing parameters" });
        }

        const result = findMostFrequentGoal(gender, parseFloat(bmi));
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};