const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require(path.join(__dirname, '../serviceAccountKey.json'));

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const inspect = async () => {
    const db = admin.firestore();
    try {
        const snapshot = await db.collection('foods').limit(1).get();
        if (snapshot.empty) {
            console.log("No foods found in DB!");
            return;
        }
        console.log("--- FOOD DOCUMENTS IN DATABASE (STARTUP PREVIEW) ---");
        snapshot.docs.forEach((doc, idx) => {
            console.log(`\n[Food #${idx + 1}] ID: ${doc.id}`);
            console.log(JSON.stringify(doc.data(), null, 2));
        });
    } catch (e) {
        console.error("Error inspecting database:", e);
    }
};

// If run directly via "node scripts/inspect_db.js"
if (require.main === module) {
    const serviceAccount = require(path.join(__dirname, '../serviceAccountKey.json'));
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    }
    inspect().then(() => process.exit(0));
}

module.exports = { inspect };
