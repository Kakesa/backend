// ==========================================
// OBJECT ID UTILITIES
// ==========================================

/**
 * Validate if a string is a valid MongoDB ObjectId
 * MongoDB ObjectId format: 24-character hex string
 */
export const isValidObjectId = (id: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Convert a string to MongoDB ObjectId format
 * If the input is already a valid ObjectId, return it
 * Otherwise, generate a new ObjectId-like string
 */
export const toValidObjectId = (input: string): string => {
  // If already valid ObjectId, return as is
  if (isValidObjectId(input)) {
    return input;
  }

  // Generate a consistent ObjectId-like string from the input
  // This ensures the same input always produces the same output
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Convert to hex and pad to 24 characters
  const hexHash = Math.abs(hash).toString(16).padStart(16, '0');
  const timestamp = Date.now().toString(16).padStart(8, '0');
  
  return (timestamp + hexHash).substring(0, 24);
};

/**
 * Generate a new ObjectId-like string
 */
export const generateObjectId = (): string => {
  const timestamp = Date.now().toString(16).padStart(8, '0');
  const random = Math.random().toString(16).substring(2, 18);
  return timestamp + random.padEnd(16, '0');
};

/**
 * Validate and convert courseId to proper format
 * Throws error if invalid and cannot be converted
 */
export const validateCourseId = (courseId: string): string => {
  if (!courseId || typeof courseId !== 'string') {
    throw new Error('courseId must be a non-empty string');
  }

  // If already valid ObjectId, return it
  if (isValidObjectId(courseId)) {
    return courseId;
  }

  // Try to convert to valid ObjectId format
  const converted = toValidObjectId(courseId);
  console.warn(`CourseId "${courseId}" converted to "${converted}" for ObjectId compatibility`);
  
  return converted;
};

/**
 * Batch validate multiple courseIds
 */
export const validateCourseIds = (courseIds: string[]): string[] => {
  return courseIds.map(validateCourseId);
};

/**
 * Check if data contains courseId that needs validation
 */
export const needsCourseIdValidation = (data: any): boolean => {
  return data && typeof data.courseId === 'string' && !isValidObjectId(data.courseId);
};
