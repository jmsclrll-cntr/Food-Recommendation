# Session Changelog: UI/UX Refinements & AI Algorithm Upgrades

This document outlines the system improvements, bug fixes, and algorithmic enhancements made to the Food Recommendation platform.

## 🎨 UI & Layout Polish
- **Biometric Form Rebalance:** Restructured the input grid in `generateWeekly.jsx`. `Gender` and `Age` are now paired on the first row, while `Height` and `Weight` intelligently sit on the second row for improved visual scanning.
- **Button Refinement:** Scaled down the previously oversized "Generate Weekly Plan" button, wrapping it in a sleek, pill-shaped design beautifully centered at the bottom of the form.
- **Unified Green Aesthetic:** Synchronized the "Calculated BMI", "Daily Metabolism", and "AI Insight" cards to share a cohesive premium green background (`#4a8a43` / `#6bcf5f`) with properly contrasting, semi-transparent white typography.
- **Snappy Physics:** Replaced sluggish 1000ms CSS transitions with a snappy 500ms `ease-in-out` Framer Motion spring physics system, making the layout compression feel premium and fluid.
- **Scrollable Sidebar Fix:** Added independent scroll mechanics (`overflow-y-auto`) to the compressed Biometrics sidebar in the submitted state, resolving the bug where the AI Insight and Metabolism cards were getting cut off at the bottom of the screen.

## 🧠 Smart Data Management
- **Transient Workspaces:** Removed legacy backend profile pre-fetching that was silently injecting default values (e.g., Age 25, Female) on page load. The Biometrics module now guarantees a 100% clean, blank slate every time it's opened.
- **Intelligent Fallbacks:** Upgraded the AI Insight box to explicitly notify the user exactly which metric is missing (e.g., *"Please select your gender to unlock AI predictions."*) rather than failing silently with a generic error.

## 🏥 Multi-Disease Dietary Filtering
- **Concurrent Conditions UI:** Stripped the old single-select "Status" dropdown and replaced it with an intuitive, multi-selectable "Health Conditions" pill array. Users can now toggle `Diabetes`, `Hypertension`, and `Heart Disease` simultaneously.
- **Dynamic Backend Nutrient Enforcement:** Rewrote the ML data service (`mlDataService.js`) to process arrays of conditions and actively apply aggressive multi-layered filtering rules on the food dataset:
  - **Diabetes:** Hard-filters foods where `sugar > 5`.
  - **Hypertension:** Hard-filters foods where `sodium > 500`.
  - **Heart Disease:** Hard-filters foods where `fat > 10` OR `sodium > 400`.
- **Insight Transparency:** The frontend AI Insight engine now dynamically reads your selected condition array and tells you *exactly* which nutrients were restricted (e.g., *"we strictly filtered out high sugar and high sodium foods"*).

## 🤖 Algorithmic & Recommendation Engine Fixes
- **Goal Normalization Bug:** Fixed a strict-matching disconnect where the ML backend was suggesting extended strings (e.g., `"lose weight"`), but the frontend UI expected shorthand tokens (`"lose"`). The frontend now intelligently normalizes the API string to perfectly trigger the UI's `(most pick)` highlighting.
- **"Round-Robin" Meal Balancer:** Completely rewrote the deficit-filling algorithm in `recommendationController.js`. Previously, the engine would blindly dump supplementary foods into whichever category fit best, causing lopsided plans. The engine now dynamically tracks the length of each meal's array and actively forces supplementary calorie-fillers into the most deprived meal first, guaranteeing a perfectly balanced food distribution across Breakfast, Lunch, and Dinner.
