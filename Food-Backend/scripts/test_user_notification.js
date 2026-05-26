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

const runUserTest = async () => {
    console.log("Triggering test email for user's active daily plans...");

    // We will trigger a notification send for breakfast, lunch, and dinner to let them see the email layouts
    console.log("\n--- Triggering Breakfast notification ---");
    await sendMealNotifications('breakfast', false);

    console.log("\n--- Triggering Lunch notification ---");
    await sendMealNotifications('lunch', false);

    console.log("\n--- Triggering Dinner notification ---");
    await sendMealNotifications('dinner', false);

    console.log("\nTest triggered successfully!");
};

runUserTest().then(() => process.exit(0)).catch(err => {
    console.error("Test failed:", err);
    process.exit(1);
});
