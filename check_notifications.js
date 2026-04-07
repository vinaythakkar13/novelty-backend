import { query } from './src/config/database.js';
import dotenv from 'dotenv';
dotenv.config();

async function checkAdmins() {
    try {
        const admins = await query('SELECT id, name, email, fcm_token FROM admins');
        console.log('Admins in database:');
        admins.forEach(admin => {
            console.log(`- ${admin.name} (${admin.email}): ${admin.fcm_token ? 'Has Token' : 'NO TOKEN'}`);
        });

        const staff = await query('SELECT id, name, email, fcm_token FROM staff WHERE fcm_token IS NOT NULL');
        console.log('\nStaff with tokens:');
        staff.forEach(s => {
            console.log(`- ${s.name} (${s.email}): ${s.fcm_token ? 'Has Token' : 'NO TOKEN'}`);
        });

    } catch (error) {
        console.error('Error checking database:', error);
    } finally {
        process.exit();
    }
}

checkAdmins();
