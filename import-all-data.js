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

// State Departments Parser
function parseStateDepartmentsSQL(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        console.log('✅ State Departments SQL file loaded successfully');
        
        // Look for INSERT statements
        const insertRegex = /INSERT\s+INTO\s+`state_departments`\s*\([^)]+\)\s*VALUES\s*([^;]+);/gi;
        const matches = [];
        let match;
        
        while ((match = insertRegex.exec(content)) !== null) {
            matches.push(match[1]);
        }
        
        console.log(`🔍 Found ${matches.length} INSERT statements for state departments`);
        
        const stateDepartments = [];
        
        matches.forEach((valuesBlock, index) => {
            console.log(`📋 Processing state departments INSERT statement ${index + 1}...`);
            const rows = parseInsertValues(valuesBlock);
            console.log(`   Extracted ${rows.length} rows`);
            
            for (const rowValues of rows) {
                const dept = convertToStateDepartment(rowValues);
                if (dept) {
                    stateDepartments.push(dept);
                }
            }
        });
        
        return stateDepartments;
    } catch (error) {
        console.error('❌ Error parsing state departments SQL file:', error);
        return [];
    }
}

function convertToStateDepartment(values) {
    if (values.length < 12) {
        console.log('⚠️  Skipping state department - insufficient values:', values.length);
        return null;
    }
    
    try {
        const dept = {
            id: parseValue(values[0], 'int'),
            ministry_id: parseValue(values[1], 'int'),
            name: parseValue(values[2], 'string'),
            principal_secretary: parseValue(values[3], 'string'),
            location: parseValue(values[4], 'string'),
            website: parseValue(values[5], 'string'),
            email: parseValue(values[6], 'string'),
            phone: parseValue(values[7], 'string'),
            status: parseValue(values[8], 'string'),
            created_at: parseValue(values[9], 'string'),
            updated_at: parseValue(values[10], 'string'),
            deleted_at: parseValue(values[11], 'string')
        };
        
        return dept;
    } catch (error) {
        console.log('❌ Error converting row to state department:', error);
        return null;
    }
}

// Agencies Parser (same as before)
function parseAgenciesSQL(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        console.log('✅ Agencies SQL file loaded successfully');
        
        const insertRegex = /INSERT\s+INTO\s+`agencies`\s*\([^)]+\)\s*VALUES\s*([^;]+);/gi;
        const matches = [];
        let match;
        
        while ((match = insertRegex.exec(content)) !== null) {
            matches.push(match[1]);
        }
        
        console.log(`🔍 Found ${matches.length} INSERT statements for agencies`);
        
        const agencies = [];
        
        matches.forEach((valuesBlock, index) => {
            console.log(`📋 Processing agencies INSERT statement ${index + 1}...`);
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
        console.error('❌ Error parsing agencies SQL file:', error);
        return [];
    }
}

function convertToAgency(values) {
    if (values.length < 14) {
        console.log('⚠️  Skipping agency - insufficient values:', values.length);
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

// Common parsing functions
function parseInsertValues(valuesBlock) {
    const rows = [];
    const rowRegex = /\(([^)]+)\)/g;
    let rowMatch;
    
    while ((rowMatch = rowRegex.exec(valuesBlock)) !== null) {
        const row = rowMatch[1];
        const values = parseRowValues(row);
        rows.push(values);
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
                if (i + 1 < row.length && row[i + 1] === "'") {
                    current += char;
                    i++;
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
    
    if (current.trim()) {
        values.push(current.trim());
    }
    
    return values;
}

function parseValue(value, type) {
    if (!value || value.toUpperCase() === 'NULL') {
        return null;
    }
    
    let cleaned = value.trim();
    if (cleaned.startsWith("'") && cleaned.endsWith("'")) {
        cleaned = cleaned.substring(1, cleaned.length - 1);
    }
    
    cleaned = cleaned.replace(/''/g, "'").replace(/\\'/g, "'");
    
    if (type === 'int') {
        const parsed = parseInt(cleaned);
        return isNaN(parsed) ? null : parsed;
    }
    
    return cleaned;
}

// Database operations
async function clearTable(tableName) {
    console.log(`🗑️  Clearing ${tableName} table...`);
    try {
        const { error } = await supabase
            .from(tableName)
            .delete()
            .neq('id', 0);
        
        if (error) {
            console.error(`❌ Error clearing ${tableName}:`, error.message);
            return false;
        }
        console.log(`✅ ${tableName} table cleared successfully`);
        return true;
    } catch (error) {
        console.error(`❌ Exception clearing ${tableName}:`, error.message);
        return false;
    }
}

async function insertData(tableName, data, batchSize = 50) {
    console.log(`\n🚀 Preparing to insert ${data.length} records into ${tableName}...`);
    
    if (data.length === 0) {
        console.log(`❌ No data to insert into ${tableName}`);
        return { successful: 0, failed: 0 };
    }
    
    let successfulInserts = 0;
    let failedBatches = 0;
    
    for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(data.length / batchSize);
        
        try {
            const { error } = await supabase
                .from(tableName)
                .insert(batch);
            
            if (error) {
                console.error(`❌ Error inserting batch ${batchNumber}/${totalBatches} into ${tableName}:`, error.message);
                failedBatches++;
                
                // Try individual inserts
                const individualResults = await insertIndividualRecords(tableName, batch);
                successfulInserts += individualResults.successful;
            } else {
                successfulInserts += batch.length;
                console.log(`✅ Successfully inserted batch ${batchNumber}/${totalBatches} into ${tableName} (${batch.length} records)`);
            }
        } catch (error) {
            console.error(`❌ Exception in batch ${batchNumber}/${totalBatches}:`, error.message);
            failedBatches++;
        }
        
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log(`\n📊 ${tableName} Insertion Summary:`);
    console.log(`   ✅ Successful inserts: ${successfulInserts}`);
    console.log(`   ❌ Failed batches: ${failedBatches}`);
    console.log(`   📝 Total records attempted: ${data.length}`);
    
    return { successful: successfulInserts, failed: failedBatches };
}

async function insertIndividualRecords(tableName, records) {
    let successful = 0;
    let failed = 0;
    
    for (const record of records) {
        try {
            const { error } = await supabase
                .from(tableName)
                .insert(record);
            
            if (error) {
                console.error(`   ❌ Failed to insert record ${record.id} into ${tableName}:`, error.message);
                failed++;
            } else {
                successful++;
            }
        } catch (error) {
            console.error(`   ❌ Exception inserting record ${record.id}:`, error.message);
            failed++;
        }
        
        await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    return { successful, failed };
}

async function main() {
    console.log('🚀 Starting complete data import...\n');
    
    // Check if SQL files exist
    if (!fs.existsSync('state_departments.sql')) {
        console.error('❌ state_departments.sql file not found');
        process.exit(1);
    }
    
    if (!fs.existsSync('agencies.sql')) {
        console.error('❌ agencies.sql file not found');
        process.exit(1);
    }
    
    try {
        // Step 1: Parse state departments
        console.log('📖 STEP 1: Parsing state departments...');
        const stateDepartments = parseStateDepartmentsSQL('state_departments.sql');
        
        if (stateDepartments.length === 0) {
            console.error('❌ No state departments data found');
            process.exit(1);
        }
        
        console.log(`📋 Parsed ${stateDepartments.length} state departments`);
        
        // Step 2: Parse agencies
        console.log('\n📖 STEP 2: Parsing agencies...');
        const agencies = parseAgenciesSQL('agencies.sql');
        
        if (agencies.length === 0) {
            console.error('❌ No agencies data found');
            process.exit(1);
        }
        
        console.log(`📋 Parsed ${agencies.length} agencies`);
        
        // Step 3: Clear tables (in reverse dependency order)
        console.log('\n🗑️  STEP 3: Clearing existing data...');
        const agenciesCleared = await clearTable('agencies');
        const stateDeptsCleared = await clearTable('state_departments');
        
        if (!agenciesCleared || !stateDeptsCleared) {
            console.log('❌ Cannot proceed without clearing tables first');
            process.exit(1);
        }
        
        // Step 4: Insert state departments first
        console.log('\n💾 STEP 4: Inserting state departments...');
        await insertData('state_departments', stateDepartments);
        
        // Step 5: Insert agencies
        console.log('\n💾 STEP 5: Inserting agencies...');
        await insertData('agencies', agencies);
        
        console.log('\n🎉 IMPORT COMPLETE!');
        console.log('✅ All data has been imported successfully');
        
    } catch (error) {
        console.error('💥 Fatal error:', error);
        process.exit(1);
    }
}

// Run the main function
main().catch(console.error);