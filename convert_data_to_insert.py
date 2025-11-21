import re

def convert_data_section(sql_content):
    # Pattern to match data sections
    data_section_pattern = r'--\s*Data for Name: (\w+); Type: TABLE DATA; Schema: public; Owner: \w+\s*--\s*COPY (\w+) \((.*?)\) FROM stdin;\s*(.*?)\s*\\\.'
    
    def replace_with_insert(match):
        table_name = match.group(2)
        columns = match.group(3)
        data_lines = match.group(4).split('\n')
        
        insert_statements = []
        for line in data_lines:
            if line.strip() and not line.startswith('--'):
                # Split by tab and handle NULL values
                values = []
                for value in line.split('\t'):
                    if value == '\\N' or not value.strip():
                        values.append('NULL')
                    else:
                        # Escape single quotes and wrap in quotes
                        escaped_value = value.replace("'", "''")
                        values.append(f"'{escaped_value}'")
                
                if values:
                    insert_sql = f"INSERT INTO {table_name} ({columns}) VALUES ({', '.join(values)}) ON CONFLICT DO NOTHING;"
                    insert_statements.append(insert_sql)
        
        return '\n'.join(insert_statements)
    
    # Replace COPY sections with INSERT statements
    converted_sql = re.sub(data_section_pattern, replace_with_insert, sql_content, flags=re.DOTALL)
    return converted_sql

# Read the migration file
with open('supabase/migrations/20251120134254_initial_data.sql', 'r') as f:
    content = f.read()

# Convert the data
converted_content = convert_data_section(content)

# Write back
with open('supabase/migrations/20251120134254_initial_data.sql', 'w') as f:
    f.write(converted_content)

print("Converted data sections to INSERT statements")
