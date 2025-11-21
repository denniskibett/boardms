const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials. Please check your .env file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearAgenciesTable() {
    console.log('🗑️  Clearing agencies table...');
    try {
        // First disable foreign key constraints
        const { error: disableError } = await supabase.rpc('disable_foreign_keys');
        if (disableError) {
            console.log('⚠️  Could not disable foreign keys (might not be supported), proceeding anyway...');
        }

        // Delete all records
        const { error } = await supabase
            .from('agencies')
            .delete()
            .neq('id', 0); // Delete all records
        
        if (error) {
            console.error('❌ Error clearing table:', error.message);
            return false;
        }
        console.log('✅ Agencies table cleared successfully');
        return true;
    } catch (error) {
        console.error('❌ Exception clearing table:', error.message);
        return false;
    }
}

async function enableForeignKeys() {
    try {
        const { error } = await supabase.rpc('enable_foreign_keys');
        if (error) {
            console.log('⚠️  Could not enable foreign keys (might not be supported)');
        } else {
            console.log('✅ Foreign keys re-enabled');
        }
    } catch (error) {
        console.log('⚠️  Exception enabling foreign keys');
    }
}

function parseSQLFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        console.log('✅ SQL file loaded successfully');
        console.log(`📊 File size: ${content.length} characters`);
        
        // Look for INSERT statements with MySQL backticks
        const insertRegex = /INSERT\s+INTO\s+`agencies`\s*\([^)]+\)\s*VALUES\s*([^;]+);/gi;
        const matches = [];
        let match;
        
        while ((match = insertRegex.exec(content)) !== null) {
            matches.push(match[1]);
        }
        
        console.log(`🔍 Found ${matches.length} INSERT statements with backticks`);
        
        if (matches.length === 0) {
            // Try without backticks as fallback
            console.log('🔄 Trying without backticks...');
            const altRegex = /INSERT\s+INTO\s+agencies\s*\([^)]+\)\s*VALUES\s*([^;]+);/gi;
            let altMatch;
            
            while ((altMatch = altRegex.exec(content)) !== null) {
                matches.push(altMatch[1]);
            }
            console.log(`🔍 Found ${matches.length} INSERT statements total`);
        }
        
        const agencies = [];
        
        matches.forEach((valuesBlock, index) => {
            console.log(`\n📋 Processing INSERT statement ${index + 1}...`);
            const rows = parseInsertValues(valuesBlock);
            console.log(`   Extracted ${rows.length} rows`);
            
            for (const rowValues of rows) {
                const agency = convertToAgency(rowValues);
                if (agency) {
                    agencies.push(agency);
                }
            }
        });
        
        return agencies;
    } catch (error) {
        console.error('❌ Error parsing SQL file:', error);
        return [];
    }
}

function parseInsertValues(valuesBlock) {
    const rows = [];
    
    // Extract individual rows
    const rowRegex = /\(([^)]+)\)/g;
    let rowMatch;
    
    while ((rowMatch = rowRegex.exec(valuesBlock)) !== null) {
        const row = rowMatch[1];
        const values = parseRowValues(row);
        
        if (values.length >= 14) {
            rows.push(values);
        }
    }
    
    return rows;
}

function parseRowValues(row) {
    const values = [];
    let current = '';
    let inQuotes = false;
    let escapeNext = false;
    
    for (let i = 0; i < row.length; i++) {
        const char = row[i];
        
        if (escapeNext) {
            current += char;
            escapeNext = false;
        } else if (char === '\\') {
            escapeNext = true;
            current += char;
        } else if (char === "'") {
            if (inQuotes) {
                // Check for escaped quote or double quote
                if (i + 1 < row.length && row[i + 1] === "'") {
                    current += char;
                    i++; // Skip next quote
                } else {
                    inQuotes = false;
                    current += char;
                }
            } else {
                inQuotes = true;
                current += char;
            }
        } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    
    // Add the last value
    if (current.trim()) {
        values.push(current.trim());
    }
    
    return values;
}

function convertToAgency(values) {
    if (values.length < 14) {
        console.log('⚠️  Skipping row - insufficient values:', values.length);
        return null;
    }
    
    try {
        const agency = {
            id: parseValue(values[0], 'int'),
            state_department_id: parseValue(values[1], 'int'),
            name: parseValue(values[2], 'string'),
            director_general: parseValue(values[3], 'string'),
            chairperson: parseValue(values[4], 'string'),
            acronym: parseValue(values[5], 'string'),
            location: parseValue(values[6], 'string'),
            website: parseValue(values[7], 'string'),
            email: parseValue(values[8], 'string'),
            phone: parseValue(values[9], 'string'),
            status_id: parseValue(values[10], 'int'),
            created_at: parseValue(values[11], 'string'),
            updated_at: parseValue(values[12], 'string'),
            deleted_at: parseValue(values[13], 'string')
        };
        
        return agency;
    } catch (error) {
        console.log('❌ Error converting row to agency:', error);
        return null;
    }
}

function parseValue(value, type) {
    if (!value || value.toUpperCase() === 'NULL') {
        return null;
    }
    
    // Remove surrounding quotes
    let cleaned = value.trim();
    if (cleaned.startsWith("'") && cleaned.endsWith("'")) {
        cleaned = cleaned.substring(1, cleaned.length - 1);
    }
    
    // Handle escaped characters
    cleaned = cleaned.replace(/''/g, "'").replace(/\\'/g, "'");
    
    if (type === 'int') {
        const parsed = parseInt(cleaned);
        return isNaN(parsed) ? null : parsed;
    }
    
    return cleaned;
}

async function insertAgencies(agencies) {
    console.log(`\n🚀 Preparing to insert ALL ${agencies.length} agencies...`);
    
    if (agencies.length === 0) {
        console.log('❌ No agencies to insert');
        return { successful: 0, failed: 0 };
    }
    
    // Insert ALL agencies in batches, even with potential foreign key issues
    const batchSize = 50;
    let successfulInserts = 0;
    let failedBatches = 0;
    let individualFailures = 0;
    
    for (let i = 0; i < agencies.length; i += batchSize) {
        const batch = agencies.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(agencies.length / batchSize);
        
        try {
            const { data, error } = await supabase
                .from('agencies')
                .insert(batch);
            
            if (error) {
                console.error(`❌ Batch ${batchNumber}/${totalBatches} failed:`, error.message);
                console.log('🔄 Trying individual inserts for this batch...');
                
                // Try inserting each record individually
                const individualResults = await insertIndividualAgencies(batch);
                successfulInserts += individualResults.successful;
                individualFailures += individualResults.failed;
                
                if (individualResults.failed > 0) {
                    failedBatches++;
                }
            } else {
                successfulInserts += batch.length;
                console.log(`✅ Successfully inserted batch ${batchNumber}/${totalBatches} (${batch.length} records)`);
            }
        } catch (error) {
            console.error(`❌ Exception in batch ${batchNumber}/${totalBatches}:`, error.message);
            failedBatches++;
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log(`\n📊 Insertion Summary:`);
    console.log(`   ✅ Successful inserts: ${successfulInserts}`);
    console.log(`   ❌ Failed batches: ${failedBatches}`);
    console.log(`   🔧 Individual failures: ${individualFailures}`);
    console.log(`   📝 Total agencies attempted: ${agencies.length}`);
    
    return { successful: successfulInserts, failed: failedBatches + individualFailures };
}

async function insertIndividualAgencies(agencies) {
    let successful = 0;
    let failed = 0;
    
    for (const agency of agencies) {
        try {
            const { error } = await supabase
                .from('agencies')
                .insert(agency);
            
            if (error) {
                console.error(`   ❌ Failed to insert agency ${agency.id} (state_dept: ${agency.state_department_id}):`, error.message);
                failed++;
            } else {
                successful++;
                console.log(`   ✅ Inserted agency ${agency.id}`);
            }
        } catch (error) {
            console.error(`   ❌ Exception inserting agency ${agency.id}:`, error.message);
            failed++;
        }
        
        await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    return { successful, failed };
}

async function main() {
    console.log('🚀 Starting agencies import (INSERT ALL RECORDS)...\n');
    
    // Check if SQL file exists
    if (!fs.existsSync('agencies.sql')) {
        console.error('❌ agencies.sql file not found in current directory');
        process.exit(1);
    }
    
    try {
        // Clear the table first
        const cleared = await clearAgenciesTable();
        if (!cleared) {
            console.log('❌ Cannot proceed without clearing the table first');
            process.exit(1);
        }
        
        // Parse the SQL file
        const agencies = parseSQLFile('agencies.sql');
        
        if (agencies.length === 0) {
            console.error('\n❌ No agencies data could be parsed from the SQL file');
            process.exit(1);
        }
        
        console.log(`\n📋 Successfully parsed ${agencies.length} agencies`);
        
        // Show agencies with state_department_id: 50
        const agenciesWithId50 = agencies.filter(a => a.state_department_id === 50);
        if (agenciesWithId50.length > 0) {
            console.log(`\n⚠️  Found ${agenciesWithId50.length} agencies with state_department_id: 50`);
            console.log('   These will be attempted despite potential foreign key issues:');
            agenciesWithId50.slice(0, 3).forEach(agency => {
                console.log(`   - ${agency.name} (ID: ${agency.id})`);
            });
            if (agenciesWithId50.length > 3) {
                console.log(`   ... and ${agenciesWithId50.length - 3} more`);
            }
        }
        
        // Insert into Supabase
        await insertAgencies(agencies);
        
        // Try to re-enable foreign keys
        await enableForeignKeys();
        
    } catch (error) {
        console.error('💥 Fatal error:', error);
        process.exit(1);
    }
}

// Run the main function
main().catch(console.error);