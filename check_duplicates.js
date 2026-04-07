import { query } from './src/config/database.js';
import dotenv from 'dotenv';
dotenv.config();

async function checkDuplicateEmails() {
    try {
        const result = await query('SELECT email, COUNT(*) as count FROM (SELECT email FROM admins UNION ALL SELECT email FROM staff) as t GROUP BY email HAVING count > 1');
        console.log('\nDuplicate emails across tables:');
        if (result.length === 0) console.log('None found.');
        result.forEach(r => console.log(`- ${r.email}: Found ${r.count} times`));
    } catch (e) { console.error(e); }
    finally { process.exit(); }
}
checkDuplicateEmails();
