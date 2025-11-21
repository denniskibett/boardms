// lib/supabase-db.ts
import { supabaseServer } from '@/lib/supabase/server';

// Define proper types for each operation
type SelectOptions = {
  select?: string;
  eq?: {
    field: string;
    value: any;
  };
  limit?: number;
  order?: {
    field: string;
    ascending?: boolean;
  };
};

type InsertOptions = {
  values: any[] | object;
};

type UpdateOptions = {
  values: object;
  eq?: {
    field: string;
    value: any;
  };
};

type DeleteOptions = {
  eq: {
    field: string;
    value: any;
  };
};

type QueryOptions = 
  | { operation: 'select'; options?: SelectOptions }
  | { operation: 'insert'; options: InsertOptions }
  | { operation: 'update'; options: UpdateOptions }
  | { operation: 'delete'; options: DeleteOptions };

export const supabaseQuery = async (table: string, config: QueryOptions) => {
  const supabase = supabaseServer();
  
  try {
    const { operation, options } = config;

    switch (operation) {
      case 'select': {
        let query = supabase.from(table).select(options?.select || '*');
        
        if (options?.eq) {
          query = query.eq(options.eq.field, options.eq.value);
        }
        
        if (options?.limit) {
          query = query.limit(options.limit);
        }
        
        if (options?.order) {
          query = query.order(options.order.field, { 
            ascending: options.order.ascending ?? true 
          });
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        return { rows: data || [] };
      }
      
      case 'insert': {
        const { data, error } = await supabase
          .from(table)
          .insert(options.values)
          .select();
        
        if (error) throw error;
        return { rows: data || [] };
      }
      
      case 'update': {
        let query = supabase
          .from(table)
          .update(options.values)
          .select();
        
        if (options.eq) {
          query = query.eq(options.eq.field, options.eq.value);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        return { rows: data || [] };
      }
      
      case 'delete': {
        let query = supabase
          .from(table)
          .delete()
          .select();
        
        if (options.eq) {
          query = query.eq(options.eq.field, options.eq.value);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        return { rows: data || [] };
      }
      
      default:
        throw new Error(`Operation ${operation} not implemented`);
    }
  } catch (error) {
    console.error('Supabase query error:', error);
    throw error;
  }
};

// Helper functions for common operations
export const supabaseDb = {
  // Select operations
  select: (table: string, options?: SelectOptions) => 
    supabaseQuery(table, { operation: 'select', options }),
  
  // Insert operations  
  insert: (table: string, values: any[] | object) => 
    supabaseQuery(table, { operation: 'insert', options: { values } }),
  
  // Update operations
  update: (table: string, values: object, where?: { field: string; value: any }) => 
    supabaseQuery(table, { operation: 'update', options: { values, eq: where } }),
  
  // Delete operations
  delete: (table: string, where: { field: string; value: any }) => 
    supabaseQuery(table, { operation: 'delete', options: { eq: where } }),
};