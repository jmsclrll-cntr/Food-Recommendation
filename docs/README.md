# Calorie Calculator System Implementation Plan

This document outlines the changes and formulas we will apply to correct the calorie calculations and dynamic metrics display in the Food Recommendation system.

## 1. Identified Issues

1. **Backend Target Calorie Goal Offset Bug**:
   In `Food-Backend/ml/utils.js`, the function `calculateTargetCalories` was only returning `TDEE` and completely ignoring the user's `goal` (`lose`, `gain`, `maintain`). This meant that when generating a weekly meal plan, the meals recommended by the KNN model targeted the base TDEE instead of the actual goal weight-adjusted calories ($TDEE \pm 500$).
   
2. **Missing Dynamic UI Metrics**:
   The frontend `generateWeekly.jsx` lacked premium, dedicated, and dynamically updated cards for:
   * **Computed BMR** (Basal Metabolic Rate)
   * **Recommended Daily Calorie Intake** (Weight-adjusted calories)
   * A clear view of these metrics before and after the weekly meal plan is generated.

---

## 2. Core Calculations (Mifflin-St Jeor Equation)

We will standardize and implement the following formulas across both the frontend and backend:

### A. Basal Metabolic Rate (BMR)
* **Male**:
  $$\text{BMR} = (10 \times \text{weight in kg}) + (6.25 \times \text{height in cm}) - (5 \times \text{age in years}) + 5$$
* **Female**:
  $$\text{BMR} = (10 \times \text{weight in kg}) + (6.25 \times \text{height in cm}) - (5 \times \text{age in years}) - 161$$

### B. Total Daily Energy Expenditure (TDEE)
$$\text{TDEE} = \text{BMR} \times \text{Activity Factor}$$

**Activity Factors**:
* **Sedentary** (No Exercise) = `1.2`
* **Light Exercise** (Lightly Active, 1-3 days/week) = `1.375`
* **Moderate Exercise** (Moderately Active, 3-5 days/week) = `1.55`
* **Very Active** (Very Active, 6-7 days/week) = `1.725`
* **Extra Active** (Super Active, Extreme) = `1.9`

### C. Recommended Daily Calorie Intake (Goal Adjustment)
* **Maintain Weight** = $\text{TDEE}$
* **Weight Loss** = $\text{TDEE} - 500$
* **Gain Weight** = $\text{TDEE} + 500$

---

## 3. What We Are Going to Do

### Step 1: Fix Backend `Food-Backend/ml/utils.js`
Modify `calculateTargetCalories` to apply the $+500$ or $-500$ calorie offset based on the selected goal:
* `"lose"`: $\text{TDEE} - 500$
* `"gain"`: $\text{TDEE} + 500$
* `"maintain"` / other: $\text{TDEE}$

This guarantees that the KNN recommendations and meal planning match the target intake perfectly.

### Step 2: Implement Dynamic UI States in `food-frontend/src/pages/generateWeekly.jsx`
1. **Dynamic `useMemo` hooks**: Create `recommendedCalories` as a live computed state on the client side.
2. **Beautiful Metrics Dashboard Grid**:
   Add four distinct Claymorphism-styled metrics cards:
   * **Calculated BMI**
   * **Computed BMR**
   * **Daily Burn (TDEE)**
   * **Recommended Calories (Target)**
3. **Responsive Layouts**:
   * **Before Plan Generation**: Display the cards in a beautiful 4-column grid spanning the page below the biometrics form.
   * **After Plan Generation**: Display the cards in a clean 2x2 grid inside the sidebar, below the biometrics overview, to ensure perfect legibility alongside the weekly schedule.
4. **Insight Update**: Update `generateInsight()` to dynamically mention the correct target calories and calculations.
