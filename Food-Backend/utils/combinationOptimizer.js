// utils/combinationOptimizer.js
//
// Meal Combination Optimizer — Branch-and-Bound Subset-Sum
//
// RULES:
//  1. Daily total MUST be <= dailyTarget (hard ceiling — never go over)
//  2. Daily total SHOULD be >= dailyTarget - 20 kcal (soft floor)
//  3. No food appears TWICE in the same day (intra-day uniqueness — always enforced)
//  4. Inter-day repeats: limited by pool size for variety, but gap-fill
//     ignores the weekly repeat cap so the system never gets stuck on day 5+

const { recommendFoodKNN } = require('../ml/knnmodel');

// ── Configuration ────────────────────────────────────────────
const MAX_ITEMS_PER_SLOT = 4;     // Max food items per meal
const NEAR_TARGET_GAP    = 20;    // Acceptable undershoot in kcal
const CANDIDATE_SIZE     = 18;    // Pool size fed into Branch-and-Bound per slot
const MEAL_RATIOS = { breakfast: 0.30, lunch: 0.40, dinner: 0.30 };

// ─────────────────────────────────────────────────────────────
// optimizeSlot
//
// Branch-and-Bound that picks the subset of `eligible` foods
// whose total is as close to `budget` as possible WITHOUT
// exceeding it.  `dayUsedIds` enforces intra-day uniqueness.
// ─────────────────────────────────────────────────────────────
function optimizeSlot(eligible, budget, dayUsedIds) {
    const pool = eligible.filter(
        f => f.id && !dayUsedIds.has(f.id) && (f.calories || 0) > 0 && (f.calories || 0) <= budget
    );
    if (pool.length === 0) return [];

    let best = [];
    let bestGap = Infinity;

    function branch(idx, subset, total) {
        const gap = budget - total;
        if (subset.length > 0 && gap >= 0 && gap < bestGap) {
            bestGap = gap;
            best = [...subset];
            if (gap === 0) return;
        }
        if (idx >= pool.length || total >= budget || subset.length >= MAX_ITEMS_PER_SLOT) return;

        for (let i = idx; i < pool.length; i++) {
            const cal = pool[i].calories || 0;
            if (total + cal > budget) continue;
            branch(i + 1, [...subset, pool[i]], total + cal);
        }
    }

    branch(0, [], 0);

    // Fallback: pick the single largest item that fits under budget
    if (best.length === 0) {
        const fit = [...pool].sort((a, b) => (b.calories || 0) - (a.calories || 0));
        if (fit.length > 0) best = [fit[0]];
    }

    return best;
}

// ─────────────────────────────────────────────────────────────
// getCandidates
//
// Builds a diverse candidate list for a slot.
// Three tiers ensure B&B has everything it needs:
//   Tier 1 – items closest to budget    (anchor dishes)
//   Tier 2 – items ≤ 70% of budget     (pairing companions)
//   Tier 3 – items ≤ 120 kcal          (tiny top-off sides)
//
// allowReused: if true, ignore the weekly frequency cap
//   (used during gap-fill so day 5-7 never run out of foods)
// ─────────────────────────────────────────────────────────────
function getCandidates(pool, budget, dayUsedIds, usedFoodIds, maxWeeklyRepeats, allowReused) {
    const avail = pool.filter(f => {
        if (!f.id || (f.grams || 0) <= 0 || (f.calories || 0) <= 0) return false;
        if (dayUsedIds.has(f.id)) return false;                            // intra-day: always block
        if (!allowReused && (usedFoodIds[f.id] || 0) >= maxWeeklyRepeats) return false; // inter-day cap
        return true;
    });

    if (avail.length === 0) return [];

    const seen = new Set();
    const out  = [];
    const add  = (list) => list.forEach(f => { if (!seen.has(f.id)) { seen.add(f.id); out.push(f); } });

    // Tier 1: closest to budget
    add([...avail]
        .sort((a, b) => Math.abs((a.calories || 0) - budget) - Math.abs((b.calories || 0) - budget))
        .slice(0, 7));

    // Tier 2: medium companions
    add([...avail]
        .filter(f => (f.calories || 0) <= budget * 0.70)
        .sort((a, b) => (b.calories || 0) - (a.calories || 0))
        .slice(0, 7));

    // Tier 3: tiny top-offs
    add([...avail]
        .filter(f => (f.calories || 0) <= 120)
        .sort((a, b) => (b.calories || 0) - (a.calories || 0))
        .slice(0, 4));

    // Shuffle for day-to-day variety
    for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
    }

    return out.slice(0, CANDIDATE_SIZE);
}

// ─────────────────────────────────────────────────────────────
// commit  — add picked foods to tracking sets
// ─────────────────────────────────────────────────────────────
function commit(foods, dayUsedIds, usedFoodIds) {
    foods.forEach(f => {
        dayUsedIds.add(f.id);
        usedFoodIds[f.id] = (usedFoodIds[f.id] || 0) + 1;
    });
}

// ─────────────────────────────────────────────────────────────
// multiPassGapFill
//
// After initial slot optimisation, if the daily total is still
// more than NEAR_TARGET_GAP kcal below target, keep adding
// single foods (up to MAX_ITEMS_PER_SLOT per slot) until the
// gap is closed or nothing more fits.
//
// This pass ALLOWS foods used on other days (allowReused=true)
// so that a small database never gets completely stuck.
// It still BLOCKS foods already in today's meals.
// ─────────────────────────────────────────────────────────────
function multiPassGapFill(slots, dailyTarget, dayUsedIds, usedFoodIds) {
    for (let pass = 0; pass < 10; pass++) {
        const currentTotal = slots.reduce((s, sl) =>
            s + sl.meal.reduce((ss, f) => ss + (f.calories || 0), 0), 0);
        const gap = dailyTarget - currentTotal;
        if (gap <= NEAR_TARGET_GAP) break;

        let added = false;

        for (const { meal, pool, budget } of slots) {
            if (meal.length >= MAX_ITEMS_PER_SLOT) continue;

            const slotTotal  = meal.reduce((s, f) => s + (f.calories || 0), 0);
            const headroom   = budget - slotTotal;
            if (headroom <= 0) continue;

            // Find the best single item that fits within headroom
            // allowReused=true: cross-day reuse permitted to close the gap
            const candidates = pool
                .filter(f =>
                    f.id &&
                    (f.grams || 0) > 0 &&
                    !dayUsedIds.has(f.id) &&             // intra-day uniqueness
                    (f.calories || 0) > 0 &&
                    (f.calories || 0) <= headroom
                )
                .sort((a, b) => (b.calories || 0) - (a.calories || 0)); // pick largest that fits

            if (candidates.length === 0) continue;

            const pick = candidates[0];
            meal.push(pick);
            dayUsedIds.add(pick.id);
            usedFoodIds[pick.id] = (usedFoodIds[pick.id] || 0) + 1;
            added = true;
            break; // recalculate gap on next pass
        }

        if (!added) break;
    }
}

// ─────────────────────────────────────────────────────────────
// pickDailyMealsOptimized  (public — called by controller)
//
// usedFoodIds: plain object { foodId: timesUsedThisWeek }
//   passed in from controller (NOT a Set).
//
// Dynamic weekly repeat cap based on pool size:
//   < 10 foods  → allow 5 repeats
//   < 20 foods  → allow 3 repeats
//   ≥ 20 foods  → allow 1 (fresh each day preferred)
// ─────────────────────────────────────────────────────────────
function pickDailyMealsOptimized(bPool, lPool, dPool, dailyTarget, usedFoodIds) {
    const bBudget = Math.round(dailyTarget * MEAL_RATIOS.breakfast);
    const lBudget = Math.round(dailyTarget * MEAL_RATIOS.lunch);
    const dBudget = Math.round(dailyTarget * MEAL_RATIOS.dinner);

    const cap = (pool) => pool.length < 10 ? 5 : pool.length < 20 ? 3 : 1;
    const maxB = cap(bPool);
    const maxL = cap(lPool);
    const maxD = cap(dPool);

    const dayUsedIds = new Set(); // reset every day — intra-day uniqueness only

    // ── Step 1: Initial slot optimisation (prefer fresh/less-used foods) ──

    const bCandidates = getCandidates(bPool, bBudget, dayUsedIds, usedFoodIds, maxB, false);
    const breakfast   = optimizeSlot(bCandidates, bBudget, dayUsedIds);
    commit(breakfast, dayUsedIds, usedFoodIds);

    const lCandidates = getCandidates(lPool, lBudget, dayUsedIds, usedFoodIds, maxL, false);
    const lunch       = optimizeSlot(lCandidates, lBudget, dayUsedIds);
    commit(lunch, dayUsedIds, usedFoodIds);

    const dCandidates = getCandidates(dPool, dBudget, dayUsedIds, usedFoodIds, maxD, false);
    const dinner      = optimizeSlot(dCandidates, dBudget, dayUsedIds);
    commit(dinner, dayUsedIds, usedFoodIds);

    // ── Step 2: Multi-pass gap-fill (reuses cross-day foods if needed) ──
    multiPassGapFill(
        [
            { meal: breakfast, pool: bPool, budget: bBudget },
            { meal: lunch,     pool: lPool, budget: lBudget },
            { meal: dinner,    pool: dPool, budget: dBudget },
        ],
        dailyTarget,
        dayUsedIds,
        usedFoodIds
    );

    const finalTotal = [...breakfast, ...lunch, ...dinner]
        .reduce((s, f) => s + (f.calories || 0), 0);

    return {
        breakfast,
        lunch,
        dinner,
        dailyTotal: Math.round(finalTotal),
    };
}

module.exports = { optimizeSlot, pickDailyMealsOptimized };
