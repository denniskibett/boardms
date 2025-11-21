import re
import sys

def convert_copy_to_insert(sql_content):
    # Pattern to match COPY statements
    copy_pattern = r"COPY (\w+\.?\w*) \((.*?)\) FROM stdin;\n(.*?)\n\\\."
    
    def replace_copy(match):
        table_name = match.group(1)
        columns = match.group(2)
        data = match.group(3)
        
        # Split data into rows
        rows = data.split('\n')
        
        # Convert each row to INSERT statement
        insert_statements = []
        for row in rows:
            if row.strip():
                # Handle NULL values and escape quotes
                values = []
                for value in row.split('\t'):
                    if value == '\\N':
                        values.append('NULL')
                    else:
                        # Escape single quotes and wrap in quotes
                        escaped_value = value.replace("'", "''")
                        values.append(f"'{escaped_value}'")
                
                insert_sql = f"INSERT INTO {table_name} ({columns}) VALUES ({', '.join(values)});"
                insert_statements.append(insert_sql)
        
        return '\n'.join(insert_statements)
    
    # Replace all COPY commands
    converted_sql = re.sub(copy_pattern, replace_copy, sql_content, flags=re.DOTALL)
    return converted_sql

if __name__ == "__main__":
    with open('supabase/migrations/0000_initial_setup.sql', 'r') as f:
        content = f.read()
    
    converted_content = convert_copy_to_insert(content)
    
    with open('supabase/migrations/0000_initial_setup.sql', 'w') as f:
        f.write(converted_content)
    
    print("Converted COPY commands to INSERT statements")
