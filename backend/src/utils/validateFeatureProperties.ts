type FeatureSchema = {
    [key: string]: {
      type: 'string' | 'number' | 'boolean' | 'enum';
      required?: boolean;
      values?: string[];
    };
  };
  
  type FeatureProperties = Record<string, any>;
  
  export function validateFeatureProperties(
    schema: FeatureSchema,
    properties: FeatureProperties
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
  
    for (const key in schema) {
      const def = schema[key];
      const value = properties[key];
  
      if (def.required && (value === undefined || value === null)) {
        errors.push(`'${key}' is required`);
        continue;
      }
  
      if (!def.required && (value === undefined || value === null)) {
        continue;
      }
  
      switch (def.type) {
        case 'string':
          if (typeof value !== 'string') errors.push(`'${key}' should be a string`);
          break;
        case 'number':
          if (typeof value !== 'number') errors.push(`'${key}' should be a number`);
          break;
        case 'boolean':
          if (typeof value !== 'boolean') errors.push(`'${key}' should be a boolean`);
          break;
        case 'enum':
          if (!def.values?.includes(value)) {
            errors.push(`'${key}' should be one of [${def.values?.join(', ')}]`);
          }
          break;
        default:
          errors.push(`Unknown type for '${key}': ${def.type}`);
      }
    }
  
    return {
      valid: errors.length === 0,
      errors,
    };
  }