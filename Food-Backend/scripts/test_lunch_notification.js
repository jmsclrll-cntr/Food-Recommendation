const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require(path.join(__dirname, '../serviceAccountKey.json'));

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const { sendMealNotifications } = require('../cron/emailScheduler');

const runLunchTest = async () => {
    console.log("Triggering lunch notification test to all accounts...");
    await sendMealNotifications('lunch', false);
    console.log("Lunch notification test completed!");
};

runLunchTest().then(() => process.exit(0)).catch(err => {
    console.error("Test failed:", err);
    process.exit(1);
});
