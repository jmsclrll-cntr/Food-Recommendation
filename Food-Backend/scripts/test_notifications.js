const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require(path.join(__dirname, '../serviceAccountKey.json'));

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const { sendMealNotifications } = require('../cron/emailScheduler');

const runTest = async () => {
    console.log("Starting manual meal notification test...");
    
    // Choose breakfast as a test
    await sendMealNotifications('breakfast', false);
    
    console.log("Manual test completed!");
};

runTest().then(() => process.exit(0)).catch(err => {
    console.error("Test failed:", err);
    process.exit(1);
});
