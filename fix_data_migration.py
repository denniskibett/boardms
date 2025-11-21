import re

def convert_all_data(sql_content):
    # Remove all existing INSERT statements to avoid duplicates
    sql_content = re.sub(r'INSERT INTO.*?;', '', sql_content, flags=re.DOTALL | re.IGNORECASE)
    
    # Pattern to match table data sections with COPY commands
    pattern = r'--\s*Data for Name: (\w+);.*?COPY (\w+) \((.*?)\) FROM stdin;\s*(.*?)\s*\\\.'
    
    def convert_to_insert(match):
        table_name = match.group(2)
        columns = match.group(3)
        data_block = match.group(4)
        
        insert_statements = []
        lines = data_block.split('\n')
        
        for line in lines:
            line = line.strip()
            if line and not line.startswith('--'):
                # Split by tab and process each value
                values = []
                for value in line.split('\t'):
                    if value == '\\N' or value == '':
                        values.append('NULL')
                    else:
                        # Escape single quotes
                        escaped = value.replace("'", "''")
                        values.append(f"'{escaped}'")
                
                if values:
                    insert_sql = f"INSERT INTO {table_name} ({columns}) VALUES ({', '.join(values)}) ON CONFLICT DO NOTHING;"
                    insert_statements.append(insert_sql)
        
        return '\n'.join(insert_statements)
    
    # Convert all COPY sections
    converted = re.sub(pattern, convert_to_insert, sql_content, flags=re.DOTALL)
    
    # Remove any remaining raw data lines that start with numbers
    lines = converted.split('\n')
    cleaned_lines = []
    for line in lines:
        if not re.match(r'^\d+.*\t', line) and not line.strip().startswith('COPY ') and line.strip() != '\\.':
            cleaned_lines.append(line)
    
    return '\n'.join(cleaned_lines)

# Read the file
with open('supabase/migrations/20251120134254_initial_data.sql', 'r') as f:
    content = f.read()

# Convert the data
fixed_content = convert_all_data(content)

# Write back
with open('supabase/migrations/20251120134254_initial_data.sql', 'w') as f:
    f.write(fixed_content)

print("✅ All raw data converted to INSERT statements")
