const cron = require('node-cron');
const nodemailer = require('nodemailer');
const admin = require('firebase-admin');
require('dotenv').config();

const db = admin.firestore();

// --- NODEMAILER TRANSPORT ---
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

// --- GET TODAY'S DAY NAME ---
const getTodayName = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
};

// --- BUILD HTML EMAIL ---
const buildMealEmail = (username, mealType, meals, isReminder) => {
    const mealTypeDisplay = mealType.charAt(0).toUpperCase() + mealType.slice(1);
    const greeting = isReminder
        ? `Hey ${username}, just a friendly reminder! 🔔`
        : `Good ${mealType === 'breakfast' ? 'morning' : mealType === 'lunch' ? 'afternoon' : 'evening'}, ${username}! 🌿`;

    const subtitle = isReminder
        ? `It looks like you may have missed your <strong>${mealTypeDisplay}</strong> notification. Here's your meal plan again:`
        : `It's time for your <strong>${mealTypeDisplay}</strong>! Here's what's on your plan today:`;

    const mealCards = meals.map(meal => {
        const imageUrl = meal.imageUrl || meal.imageURL || meal.image || meal.imagePath || '';
        const fallbackImage = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=600';
        const imgSrc = imageUrl || fallbackImage;

        return `
            <div style="background: #ffffff; border-radius: 16px; overflow: hidden; margin-bottom: 16px; border: 1px solid #e8f0e6; box-shadow: 0 2px 8px rgba(45,90,39,0.08);">
                <img src="${imgSrc}" alt="${meal.name}" style="width: 100%; height: 180px; object-fit: cover; display: block;" />
                <div style="padding: 16px 20px;">
                    <h3 style="margin: 0 0 8px 0; font-family: Georgia, serif; font-size: 18px; color: #1c3a1c; font-style: italic;">${meal.name}</h3>
                    <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                        <span style="background: #f0f7ee; color: #2d5a27; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">${meal.calories || '—'} kcal</span>
                        <span style="background: #f0f7ee; color: #2d5a27; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">${meal.grams || '—'}g</span>
                        ${meal.protein ? `<span style="background: #f0f7ee; color: #2d5a27; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">Protein ${meal.protein}g</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f5faf4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="max-width: 560px; margin: 0 auto; padding: 24px 16px;">
            
            <!-- Header -->
            <div style="text-align: center; padding: 32px 20px; background: linear-gradient(135deg, #1c3a1c 0%, #2d5a27 100%); border-radius: 20px; margin-bottom: 24px;">
                <h1 style="margin: 0; font-family: Georgia, serif; font-size: 28px; color: #ffffff; font-style: italic; letter-spacing: 1px;">NutriFind</h1>
                <p style="margin: 6px 0 0; font-size: 9px; text-transform: uppercase; letter-spacing: 3px; color: #8ecb84; font-weight: 800;">Premium Nutrition</p>
                <div style="width: 40px; height: 2px; background: #8ecb84; margin: 16px auto 0; border-radius: 2px;"></div>
            </div>

            <!-- Greeting -->
            <div style="background: #ffffff; border-radius: 16px; padding: 24px; margin-bottom: 20px; border: 1px solid #e8f0e6;">
                <p style="font-size: 16px; color: #1c3a1c; margin: 0 0 8px; font-weight: 600;">${greeting}</p>
                <p style="font-size: 14px; color: #5a7a56; margin: 0; line-height: 1.6;">${subtitle}</p>
            </div>

            <!-- Meal Type Badge -->
            <div style="text-align: center; margin-bottom: 16px;">
                <span style="display: inline-block; background: #2d5a27; color: #fff; padding: 6px 24px; border-radius: 20px; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 3px;">${isReminder ? '⏰ Reminder · ' : ''}${mealTypeDisplay}</span>
            </div>

            <!-- Meal Cards -->
            ${mealCards}

            <!-- Footer -->
            <div style="text-align: center; padding: 24px 16px; border-top: 1px solid #e8f0e6; margin-top: 8px;">
                <p style="font-size: 11px; color: #9ab896; margin: 0;">Stay consistent with your nutrition goals. 💚</p>
                <p style="font-size: 10px; color: #b8c9b5; margin: 8px 0 0;">This is an automated notification from NutriFind.</p>
            </div>
        </div>
    </body>
    </html>
    `;
};

// --- CORE: SEND MEAL NOTIFICATIONS ---
const sendMealNotifications = async (mealType, isReminder = false) => {
    const label = isReminder ? 'REMINDER' : 'NOTIFICATION';
    console.log(`\n📧 [${label}] Sending ${mealType} emails...`);

    try {
        const transporter = createTransporter();
        const todayName = getTodayName();
        const collectionName = `${todayName}Plans`;

        // 1. Get all users who have a plan for today
        const plansSnapshot = await db.collection(collectionName).get();

        if (plansSnapshot.empty) {
            console.log(`   No plans found in ${collectionName}. Skipping.`);
            return;
        }

        let sentCount = 0;
        let skipCount = 0;

        for (const doc of plansSnapshot.docs) {
            const userId = doc.id;
            const planData = doc.data();
            const meals = planData.meals?.[mealType];

            // Skip if no meals for this type
            if (!meals || meals.length === 0) {
                skipCount++;
                continue;
            }

            // 2. Get the user's email from Firestore 'users' collection
            try {
                const userDoc = await db.collection('users').doc(userId).get();
                if (!userDoc.exists) {
                    console.log(`   ⚠ User ${userId} not found in users collection. Skipping.`);
                    skipCount++;
                    continue;
                }

                const userData = userDoc.data();
                const email = userData.email;
                const username = userData.username || 'there';

                if (!email) {
                    console.log(`   ⚠ User ${userId} has no email. Skipping.`);
                    skipCount++;
                    continue;
                }

                // 3. Build and send the email
                const mealTypeDisplay = mealType.charAt(0).toUpperCase() + mealType.slice(1);
                const subject = isReminder
                    ? `⏰ Reminder: Your ${mealTypeDisplay} is waiting! — NutriFind`
                    : `🍽️ ${mealTypeDisplay} Time! Here's your meal plan — NutriFind`;

                const html = buildMealEmail(username, mealType, meals, isReminder);

                await transporter.sendMail({
                    from: `"NutriFind" <${process.env.EMAIL_USER}>`,
                    to: email,
                    subject,
                    html
                });

                sentCount++;
                console.log(`   ✅ Sent ${mealType} ${label.toLowerCase()} to ${email}`);

            } catch (userErr) {
                console.error(`   ❌ Error processing user ${userId}:`, userErr.message);
            }
        }

        console.log(`📧 [${label}] Done. Sent: ${sentCount}, Skipped: ${skipCount}\n`);

    } catch (error) {
        console.error(`❌ [${label}] Fatal error sending ${mealType} notifications:`, error.message);
    }
};

// --- SCHEDULE ALL CRON JOBS (Asia/Manila timezone) ---
const startEmailScheduler = () => {
    console.log(`\n🕐 Email Notification Scheduler started (Asia/Manila timezone)`);
    console.log(`   Breakfast: 7:00 AM & 7:30 AM`);
    console.log(`   Lunch:     12:00 PM & 1:30 PM`);
    console.log(`   Dinner:    6:00 PM & 7:30 PM\n`);

    // --- BREAKFAST ---
    // 7:00 AM
    cron.schedule('0 7 * * *', () => {
        sendMealNotifications('breakfast', false);
    }, { timezone: 'Asia/Manila' });

    // 7:30 AM (reminder)
    cron.schedule('30 7 * * *', () => {
        sendMealNotifications('breakfast', true);
    }, { timezone: 'Asia/Manila' });

    // --- LUNCH ---
    // 12:00 PM
    cron.schedule('0 12 * * *', () => {
        sendMealNotifications('lunch', false);
    }, { timezone: 'Asia/Manila' });

    // 1:30 PM (reminder)
    cron.schedule('30 13 * * *', () => {
        sendMealNotifications('lunch', true);
    }, { timezone: 'Asia/Manila' });

    // --- DINNER ---
    // 6:00 PM
    cron.schedule('0 18 * * *', () => {
        sendMealNotifications('dinner', false);
    }, { timezone: 'Asia/Manila' });

    // 7:30 PM (reminder)
    cron.schedule('30 19 * * *', () => {
        sendMealNotifications('dinner', true);
    }, { timezone: 'Asia/Manila' });
};

module.exports = { startEmailScheduler, sendMealNotifications };
