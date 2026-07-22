import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcrypt';

const BCRYPT_ROUNDS = 12;

async function createAdminUser() {
    const db = await open({
        filename: 'teklif.db',
        driver: sqlite3.Database
    });

    const passwordHash = await bcrypt.hash('admin', BCRYPT_ROUNDS);
    
    try {
        await db.run(
            `INSERT INTO users (id, username, name, email, role, password, avatarUrl, isActive, createdAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            'usr-admin',
            'admin',
            'İlker (Sistem Yöneticisi)',
            'admin@teklifpro.com.tr',
            'ADMIN',
            passwordHash,
            null,
            1,
            new Date().toISOString()
        );
        console.log('Admin kullanıcı başarıyla oluşturuldu: admin / admin');
    } catch (err) {
        console.log('Kullanıcı zaten var, güncelleniyor...');
        await db.run(
            `UPDATE users SET password = ?, isActive = 1 WHERE username = ?`,
            passwordHash,
            'admin'
        );
        console.log('Admin kullanıcı güncellendi: admin / admin');
    }
}

createAdminUser().catch(console.error);