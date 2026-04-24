const knn = require('../ml/knnmodel');
const dt = require('../ml/decisionTreeModel');

exports.getDietRecommendation = (req, res) => {
    try {
        const { height, weight, target, condition } = req.body;

        // Map strings from frontend to numbers for ML
        const targetMap = { "lose": 0, "gain": 1, "maintain": 2 };
        const condMap = { "none": 0, "diabetes": 1, "hypertension": 2, "heart disease": 3 };

        const input = [
            Number(height), 
            Number(weight), 
            targetMap[target.toLowerCase()] || 0, 
            condMap[condition.toLowerCase()] || 0
        ];

        // Run both algorithms
        const knnPrediction = knn.predict(input);
        const dtPrediction = dt.predict(input);

        const dietPlans = ["Low Carb Diet", "High Protein Diet", "Low Sugar Diet", "Low Sodium Diet"];

        res.json({
            success: true,
            recommendation: dietPlans[dtPrediction], // DT is usually better for medical conditions
            alternative: dietPlans[knnPrediction]
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};