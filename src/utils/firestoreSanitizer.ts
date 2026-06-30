/**
 * Utility to sanitize and validate data before writing to Firestore.
 * Firestore strictly forbids:
 * 1. Nested arrays (e.g., [ [1, 2], [3, 4] ])
 * 2. undefined values
 */

export function sanitizeFirestoreData(data: any): any {
  if (data === undefined) return undefined;
  if (data === null) return null;

  if (Array.isArray(data)) {
    // Recursively sanitize elements
    let processedArray = data
      .map(item => sanitizeFirestoreData(item))
      .filter(item => item !== undefined); // Remove undefined items entirely

    // Firestore prevents arrays inside arrays. Flatten them if found.
    const hasNestedArrays = processedArray.some(item => Array.isArray(item));
    if (hasNestedArrays) {
      processedArray = processedArray.flat(Infinity);
    }
    return processedArray;
  }

  if (typeof data === 'object') {
    const clean: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value === undefined) continue;
      const sanitizedValue = sanitizeFirestoreData(value);
      if (sanitizedValue === undefined) continue;
      clean[key] = sanitizedValue;
    }
    return clean;
  }

  return data;
}

export function validateFirestoreData(data: any, path = 'root'): void {
  if (data === undefined) {
    throw new Error(`Firestore Validation Failed: undefined value at ${path}`);
  }
  if (data === null) return;

  if (Array.isArray(data)) {
    for (let i = 0; i < data.length; i++) {
      if (Array.isArray(data[i])) {
        throw new Error(`Firestore Validation Failed: Nested array found at ${path}[${i}]`);
      }
      validateFirestoreData(data[i], `${path}[${i}]`);
    }
    return;
  }

  if (typeof data === 'object') {
    for (const [key, value] of Object.entries(data)) {
      validateFirestoreData(value, `${path}.${key}`);
    }
  }
}
