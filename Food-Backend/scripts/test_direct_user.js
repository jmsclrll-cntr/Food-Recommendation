const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require(path.join(__dirname, '../serviceAccountKey.json'));

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();
const { sendMealNotifications } = require('../cron/emailScheduler');
const nodemailer = require('nodemailer');
const { startEmailScheduler } = require('../cron/emailScheduler');

const getTodayName = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
};

// Custom builder for email structure from emailScheduler.js
const { startEmailScheduler: _unused, sendMealNotifications: _unused2, ...rest } = require('../cron/emailScheduler');

const runDirectTest = async () => {
    const targetEmails = ['cantrejames33@gmail.com', 'carlcantre24@gmail.com'];
    console.log("Starting targeted direct email test for:", targetEmails);

    const todayName = getTodayName();
    const collectionName = `${todayName}Plans`;

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    for (const email of targetEmails) {
        try {
            // Find user doc by email
            const userSnap = await db.collection('users').where('email', '==', email).limit(1).get();
            if (userSnap.empty) {
                console.log(`User email ${email} not found in users collection.`);
                continue;
            }

            const userDoc = userSnap.docs[0];
            const userId = userDoc.id;
            const userData = userDoc.data();

            // Find plan for today
            const planDoc = await db.collection(collectionName).doc(userId).get();
            if (!planDoc.exists) {
                console.log(`No daily plan found for ${email} on ${todayName}.`);
                continue;
            }

            const planData = planDoc.data();
            const meals = planData.meals?.breakfast || planData.meals?.lunch || planData.meals?.dinner || [];

            if (meals.length === 0) {
                console.log(`No meals found in plan for ${email} today.`);
                continue;
            }

            console.log(`Found active meals for ${email}. Sending test notification...`);

            // Dynamically import or rebuild mail formatting logic
            // Since we want to use the exact function, let's call sendMealNotifications but only for this user
            // We can temporarily modify the DB or just send directly using a similar template
            const emailSchedulerModule = require('../cron/emailScheduler');
            // We can just construct a beautiful HTML from the module using custom template or let the cron module handle it.
            // Since the user is in the database, our main loop will send it to them anyway!
            // But let's send a custom test email right now to make sure they get it instantly:
            
            const html = `
            <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #f5faf4;">
                <h2 style="font-family: Georgia, serif; color: #1c3a1c; font-style: italic; text-align: center; margin-bottom: 5px;">NutriFind</h2>
                <p style="font-size: 9px; text-transform: uppercase; letter-spacing: 0.2em; text-align: center; color: #6a9966; margin-top: 0; font-weight: bold; margin-bottom: 25px;">Direct Test Notification</p>
                <p>Hi ${userData.username || 'there'},</p>
                <p>Here is your meal notification test! Today's protocol contains:</p>
                <div style="background-color: #ffffff; padding: 15px; border-radius: 8px; border: 1px solid #e8f0e6; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #1c3a1c;">${meals[0].name}</h3>
                    <p style="font-size: 13px; color: #5a7a56;">Calories: ${meals[0].calories} kcal | Grams: ${meals[0].grams}g</p>
                    ${meals[0].imageUrl || meals[0].imageURL || meals[0].image ? `<img src="${meals[0].imageUrl || meals[0].imageURL || meals[0].image}" style="width: 100%; border-radius: 8px; margin-top: 10px; max-height: 200px; object-fit: cover;" />` : ''}
                </div>
                <p style="font-size: 12px; color: #718096; text-align: center;">NutriFind Premium Nutrition scheduler is active for Philippine time!</p>
            </div>
            `;

            await transporter.sendMail({
                from: `"NutriFind" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: `🍽️ Direct Test: Your Meal Plan is ready!`,
                html
            });

            console.log(`✅ Direct test notification email sent successfully to ${email}!`);
        } catch (err) {
            console.error(`Error sending direct test to ${email}:`, err.message);
        }
    }
};

runDirectTest().then(() => process.exit(0));
