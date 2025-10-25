const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create database connection
const dbPath = path.join(__dirname, 'registrations.db');
const db = new sqlite3.Database(dbPath);

console.log('🗑️  Quick Registration Cleanup');
console.log('==============================');

// Check current count
db.get("SELECT COUNT(*) as count FROM registrations", (err, row) => {
    if (err) {
        console.error('❌ Error:', err.message);
        db.close();
        return;
    }
    
    const count = row.count;
    console.log(`📊 Found ${count} registrations`);
    
    if (count === 0) {
        console.log('✅ Database is already clean');
        db.close();
        return;
    }
    
    // Delete all registrations
    console.log('🔄 Deleting all registrations...');
    db.run("DELETE FROM registrations", function(err) {
        if (err) {
            console.error('❌ Error:', err.message);
        } else {
            console.log(`✅ Deleted ${this.changes} registrations`);
        }
        
        // Reset auto-increment
        db.run("DELETE FROM sqlite_sequence WHERE name='registrations'", (err) => {
            if (!err) {
                console.log('🔄 Reset auto-increment counter');
            }
            
            db.close();
            console.log('✅ Cleanup completed');
        });
    });
});

