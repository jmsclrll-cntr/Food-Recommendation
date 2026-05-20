# 🥗 Optimal Food Database Curation Guide

For the **Branch-and-Bound combination search** to perform mathematical matching and recommend perfect meal combinations (hitting daily targets like 1500 kcal, 2000 kcal, 2300 kcal, or 3000 kcal), your Firestore `foods` database needs a healthy mix of items across different calorie tiers.

Below is the blueprint for curating your food database to achieve the absolute best recommendation variety, accuracy, and nutritional balance.

---

## 📋 Required Database Fields & Calorie Ranges

To ensure the recommendation algorithm can calculate exact daily totals and filter out allergens or health conditions correctly, construct your Firestore documents using this schema:

| Firestore Field | Data Type | Requirement | Optimized Calorie / Value Guidelines (Tighter Tiers) |
| :--- | :---: | :---: | :--- |
| `name` | String | **Required** | The name of the food item (e.g. `"Grilled Salmon Bowl"`). |
| `type` | String | **Required** | Must be strictly lowercase: `'breakfast'`, `'lunch'`, or `'dinner'`. |
| `grams` | Number | **Required** | Portion weight in grams. Must be greater than `0`. |
| `calories` | Number | **Required** | The exact calorie count. To ensure maximum optimization accuracy, align items to these tighter ranges:<br><br>**🍳 Breakfast Calorie Tiers:**<br>• **Anchors:** `400 – 500 kcal` *(e.g. Loaded Oats, Avocado Toast)*<br>• **Companions:** `200 – 300 kcal` *(e.g. Scrambled Eggs, Yogurt)*<br>• **Top-offs:** `50 – 120 kcal` *(e.g. Banana, Berries, Fruit Juice)*<br><br>**🍛 Lunch Calorie Tiers:**<br>• **Anchors:** `500 – 650 kcal` *(e.g. Chicken Rice Bowl, Salmon Quinoa)*<br>• **Companions:** `300 – 450 kcal` *(e.g. Turkey Wrap, Lentil Soup)*<br>• **Top-offs:** `50 – 150 kcal` *(e.g. Side Salad, Sweet Potato)*<br><br>**🍲 Dinner Calorie Tiers:**<br>• **Anchors:** `400 – 550 kcal` *(e.g. Cod with Veggies, Turkey Chili)*<br>• **Companions:** `200 – 350 kcal` *(e.g. Eggplant Parmesan, Vegetable Curry)*<br>• **Top-offs:** `50 – 120 kcal` *(e.g. Steamed Broccoli, Sauteed Mushrooms)* |
| `protein` | Number | Recommended | Protein in grams. Renders inside the item badges. |
| `carbs` *(or `carbohydrates`)* | Number | Recommended | Carbohydrates in grams. Renders inside the item badges. |
| `fat` *(or `saturatedFat`)* | Number | Recommended | Fats in grams. Checked by heart disease conditions. |
| `sodium` | Number | Recommended | Sodium in milligrams. Checked by hypertension conditions. |
| `sugar` | Number | Recommended | Sugar in grams. Checked by diabetes conditions. |
| `fiber` | Number | Recommended | Dietary fiber in grams. Renders inside the item badges. |
| `ingredients` | Array / String | **Required** | An array of strings `["egg", "peanut"]` or comma-separated string `"egg, peanut"`. Checked by the allergen avoidance filter. |

---

## 📊 Core Target Split

The algorithm distributes your daily target calories across three meals using this standard ratio:
* **Breakfast (30%):** Lighter starters and standard breakfast calories.
* **Lunch (40%):** The largest, most energy-dense meal of the day.
* **Dinner (30%):** A balanced closing meal.

---

## 🍽️ Recommended Food Database Sizes

To ensure the weekly meal planner can generate a full 7-day schedule **without repeating meals on consecutive days** (thanks to our deduplication checks), aim for the following minimum collection sizes in your Firestore `foods` database:

| Meal Type | Minimum Unique Foods | Recommended Unique Foods | Key Calorie Tiers Needed |
| :--- | :---: | :---: | :--- |
| **Breakfast** | 15+ items | **30+ items** | Anchors, Companions, Top-off Sides |
| **Lunch** | 20+ items | **40+ items** | Anchors, Companions, Top-off Sides |
| **Dinner** | 20+ items | **40+ items** | Anchors, Companions, Top-off Sides |
| **Total Pool** | **55+ items** | **110+ items** | *Diverse ingredients & health-friendly options* |

---

## 📈 Calorie Distribution Matrix for Common Goals

This matrix highlights the target meal budgets the algorithm calculates based on different TDEE targets, showing what food ranges will be queried:

| Daily Goal Target | Breakfast (30%) | Lunch (40%) | Dinner (30%) | Best Food Combination Strategy |
| :--- | :---: | :---: | :---: | :--- |
| **1500 kcal** *(Loss)* | **450 kcal** | **600 kcal** | **450 kcal** | 1 Medium + 1 Small item |
| **2000 kcal** *(Maintain)*| **600 kcal** | **800 kcal** | **600 kcal** | 1 Anchor + 1 Small or 2 Medium items |
| **2300 kcal** *(Gain/Active)*| **690 kcal** | **920 kcal** | **690 kcal** | 1 Anchor + 1 Medium + 1 Small item |
| **3000 kcal** *(Bulking)* | **900 kcal** | **1200 kcal** | **900 kcal** | 2 Anchors + 1 Medium item |

---

## 💡 Quick Tips for High-Quality Recommendations

1. **Avoid Zero-Calorie Items:** Ensure every food entry in Firestore has a `calories` value greater than `0`. The optimizer skips foods with zero or empty calories to prevent calculation errors.
2. **Provide Accurate Grams:** Every item should have a realistic portion size in the `grams` field.
3. **Fill Out Health Tags:** To support diabetes, hypertension, and heart disease filters, make sure your foods have accurate `sugar`, `sodium`, and `fat` measurements.
4. **Mix Up Ingredients:** Ensure the `ingredients` field is filled out correctly (either as an array of strings or a comma-separated list) so the allergen avoidance system works flawlessly.

---

## ❓ Why Is the Suggested Food So Far From My Daily Target? — Honest Answer

**Short answer: It is BOTH — your database is too small AND the algorithm had bugs. Here is the full honest breakdown.**

### Problem 1 — The Database Is Too Small (Primary Cause)

This is the single biggest reason. The optimizer works like a **mathematical puzzle**: it tries to combine foods like building blocks to reach your exact calorie target (e.g. 690 kcal for breakfast). This only works if your database has foods across different calorie sizes — big anchors (400–500 kcal), medium companions (200–300 kcal), and small top-offs (50–120 kcal).

If your database only has, say, 5 breakfast items and they are all around 500–600 kcal each, the optimizer **cannot combine them** because two of them together (1000–1200 kcal) would exceed the budget. So it is forced to pick just one item (e.g. 520 kcal) and leave a 170 kcal gap unfilled. Multiply this across breakfast, lunch, and dinner and you get a 400–700 kcal daily shortfall.

| Your pool size | What happens |
| :--- | :--- |
| < 5 items per meal type | Almost guaranteed large calorie gaps. The system has no building blocks to combine. |
| 5–14 items per meal type | Gaps will occur, especially on days 4–7 when many foods are already used. |
| 15–29 items per meal type | Reasonable results. Some days may still fall short by 100–200 kcal. |
| 30+ items per meal type | Near-perfect results. The algorithm can consistently hit within 20 kcal of target. |

**Bottom line: you need at least 15 foods per meal type (breakfast, lunch, dinner) with a spread across the three calorie tiers above, or the math simply cannot work.**

---

### Problem 2 — The Algorithm Had Bugs (Secondary Cause, Now Fixed)

Even with a good database, the old code had three bugs that made things worse:

| Bug | What it caused | Status |
| :--- | :--- | :---: |
| Controller passed a `Set` instead of a frequency map | The repeat-allowance logic never activated. Every food was locked out after being used once. | ✅ Fixed |
| Day 4–7 starvation | By mid-week, `usedFoodIds` had accumulated so many foods that candidate lists came back empty, leaving entire meal slots blank. | ✅ Fixed |
| Gap-fill ran only once | After picking meals, if there was a 500 kcal gap left, adding one 100 kcal snack didn't help. The system gave up after 1 attempt. | ✅ Fixed (now runs up to 10 passes) |

The algorithm now:
- Runs a **multi-pass gap-fill** — keeps adding foods until the daily total is within 20 kcal of target or nothing more fits.
- Allows **cross-day food reuse** during gap-fill — if a food was used on Monday but is the only thing that fits the gap on Friday, it will be picked again.
- Enforces **intra-day uniqueness strictly** — the same food will never appear twice in the same day's meals.
- Enforces a **hard ceiling** — the daily total will never be higher than the target.

---

### What You Should Do

1. **Add more foods to Firestore** — aim for 30+ per meal type. Focus on covering all three calorie tiers.
2. **Regenerate the plan** — after adding new foods, generate a fresh weekly plan and the gap should drop dramatically.
3. **Check the `type` field** — every food must have `type: 'breakfast'`, `type: 'lunch'`, or `type: 'dinner'` (lowercase). Foods with missing or wrong types are invisible to the optimizer.
4. **Check the `calories` and `grams` fields** — both must be filled with a number greater than 0, otherwise the item is skipped.
