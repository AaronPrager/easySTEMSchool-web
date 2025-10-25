const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create database connection
const dbPath = path.join(__dirname, 'registrations.db');
const db = new sqlite3.Database(dbPath);

console.log('🗑️  Registration Cleanup Script');
console.log('================================');

// First, let's check how many registrations exist
db.get("SELECT COUNT(*) as count FROM registrations", (err, row) => {
    if (err) {
        console.error('❌ Error checking registrations:', err.message);
        db.close();
        return;
    }
    
    const count = row.count;
    console.log(`📊 Found ${count} registrations in the database`);
    
    if (count === 0) {
        console.log('✅ No registrations to delete. Database is already clean.');
        db.close();
        return;
    }
    
    // Ask for confirmation
    console.log('\n⚠️  WARNING: This will permanently delete ALL registrations!');
    console.log('This action cannot be undone.');
    
    // For safety, we'll require explicit confirmation
    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    rl.question('\nType "DELETE ALL" to confirm deletion: ', (answer) => {
        rl.close();
        
        if (answer === 'DELETE ALL') {
            console.log('\n🔄 Deleting all registrations...');
            
            // Delete all registrations
            db.run("DELETE FROM registrations", function(err) {
                if (err) {
                    console.error('❌ Error deleting registrations:', err.message);
                } else {
                    console.log(`✅ Successfully deleted ${this.changes} registrations`);
                    console.log('🎉 Database cleanup completed!');
                }
                
                // Reset the auto-increment counter
                db.run("DELETE FROM sqlite_sequence WHERE name='registrations'", (err) => {
                    if (err) {
                        console.log('ℹ️  Note: Could not reset auto-increment counter');
                    } else {
                        console.log('🔄 Reset auto-increment counter');
                    }
                    
                    db.close((err) => {
                        if (err) {
                            console.error('❌ Error closing database:', err.message);
                        } else {
                            console.log('✅ Database connection closed');
                        }
                    });
                });
            });
        } else {
            console.log('❌ Deletion cancelled. No changes made.');
            db.close();
        }
    });
});

