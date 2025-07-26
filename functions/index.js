
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Function to set admin custom claims
exports.setAdminClaim = functions.https.onCall(async (data, context) => {
  // Check if the user calling this function is already an admin
  if (context.auth && context.auth.token && context.auth.token.admin === true) {
    // Allow admins to set other users as admins
    try {
      await admin.auth().setCustomUserClaims(data.uid, { admin: true });
      return { message: 'Admin claim set successfully' };
    } catch (error) {
      throw new functions.https.HttpsError('internal', error.message);
    }
  }

  // For the very first admin, you can manually run this in Firebase console
  // or temporarily allow it here with proper security
  throw new functions.https.HttpsError('permission-denied', 'Only admins can set admin claims');
});

// Function to remove admin custom claims
exports.removeAdminClaim = functions.https.onCall(async (data, context) => {
  // Check if the user calling this function is an admin
  if (context.auth && context.auth.token && context.auth.token.admin === true) {
    try {
      await admin.auth().setCustomUserClaims(data.uid, { admin: false });
      return { message: 'Admin claim removed successfully' };
    } catch (error) {
      throw new functions.https.HttpsError('internal', error.message);
    }
  }

  throw new functions.https.HttpsError('permission-denied', 'Only admins can remove admin claims');
});

// Function to list all users (admin only)
exports.listUsers = functions.https.onCall(async (data, context) => {
  // Check if the user calling this function is an admin
  if (context.auth && context.auth.token && context.auth.token.admin === true) {
    try {
      const listUsersResult = await admin.auth().listUsers(1000);
      return {
        users: listUsersResult.users.map(user => ({
          uid: user.uid,
          email: user.email,
          customClaims: user.customClaims || {}
        }))
      };
    } catch (error) {
      throw new functions.https.HttpsError('internal', error.message);
    }
  }

  throw new functions.https.HttpsError('permission-denied', 'Only admins can list users');
});
