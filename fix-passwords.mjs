import bcrypt from 'bcrypt';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const BCRYPT_ROUNDS = 12;

async function fixPasswords() {
    try {
        const db = await open({
            filename: 'teklif.db',
            driver: sqlite3.Database
        });

        const users = [
            { id: 'usr-admin', password: 'admin' },
            { id: 'usr-sales', password: 'satis' },
            { id: 'usr-tech', password: 'teknik' }
        ];

        console.log('🔧 Kullanıcı şifreleri düzeltiliyor...\n');

        for (const user of users) {
            const hashedPassword = await bcrypt.hash(user.password, BCRYPT_ROUNDS);
            await db.run(
                'UPDATE users SET password = ? WHERE id = ?',
                hashedPassword,
                user.id
            );
            console.log(`✅ ${user.password} şifreli kullanıcı güncellendi (ID: ${user.id})`);
        }

        console.log('\n✨ Tüm şifreler başarıyla bcrypt hash olarak güncellendi!');
        
        await db.close();
        console.log('\nŞimdi giriş yapabilirsiniz:');
        console.log('  - admin / admin');
        console.log('  - satis / satis');
        console.log('  - teknik / teknik');
    } catch (error) {
        console.error('❌ Hata:', error.message);
    }
}

fixPasswords();
