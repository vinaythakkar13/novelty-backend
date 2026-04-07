import firebaseAdmin from '../config/firebase.js';
import { query } from '../config/database.js';

export const sendNotification = async (token, title, body, data = {}, recipientLabel = 'unknown') => {
    if (!firebaseAdmin) {
        console.warn('Firebase Admin not initialized. Skipping notification.');
        return;
    }

    if (!token) {
        console.warn(`No FCM token provided for ${recipientLabel}. Skipping notification.`);
        return;
    }

    const message = {
        notification: {
            title,
            body,
        },
        data,
        token,
    };

    try {
        console.log(`Sending notification to ${recipientLabel}...`);
        const response = await firebaseAdmin.messaging().send(message);
        console.log(`Successfully sent message to ${recipientLabel}. Response:`, response);
        return response;
    } catch (error) {
        console.error(`Error sending message to ${recipientLabel}:`, error.message);
        // If token is invalid, we might want to clear it from DB
        if (error.code === 'messaging/registration-token-not-registered') {
            console.log(`Token for ${recipientLabel} not registered, should be removed.`);
        }
        throw error;
    }
};

export const notifyAdmins = async (title, body, data = {}, excludeEmail = null) => {
    console.log('Notifying admins...');
    try {
        let sql = `SELECT email, fcm_token FROM admins WHERE fcm_token IS NOT NULL`;
        let params = [];

        if (excludeEmail) {
            sql += ` AND email != ?`;
            params.push(excludeEmail);
        }

        const admins = await query(sql, params);

        console.log(`Found ${admins.length} admins to notify. ${excludeEmail ? `(Excluded: ${excludeEmail})` : ''}`);

        if (admins.length === 0) {
            console.log('No admins with FCM tokens found.');
            return [];
        }

        const promises = admins.map(admin =>
            sendNotification(admin.fcm_token, title, body, data, `Admin (${admin.email})`).catch(err => {
                console.error(`Failed to notify admin ${admin.email}:`, err);
                return null;
            })
        );

        return Promise.all(promises);
    } catch (error) {
        console.error('Error in notifyAdmins:', error);
        throw error;
    }
};

export const notifyStaff = async (staffId, title, body, data = {}, excludeToken = null) => {
    console.log(`Notifying staff ID ${staffId}...`);
    try {
        const sql = `SELECT name, email, fcm_token FROM staff WHERE id = ? AND fcm_token IS NOT NULL`;
        const rows = await query(sql, [staffId]);
        const staff = rows[0];

        if (staff && staff.fcm_token) {
            if (excludeToken && staff.fcm_token === excludeToken) {
                console.log(`Skipping notification for staff ${staff.email} as they are the performer.`);
                return;
            }
            return await sendNotification(staff.fcm_token, title, body, data, `Staff (${staff.name} - ${staff.email})`);
        } else {
            console.log(`No active FCM token found for staff ID ${staffId}`);
        }
    } catch (error) {
        console.error(`Error notifying staff ID ${staffId}:`, error);
        throw error;
    }
};
