// ==========================================
// API VALIDATION UTILITIES
// ==========================================

import { validateCourseId, needsCourseIdValidation } from "./objectId";

/**
 * Validate and transform request data to ensure courseId compatibility
 */
export const validateRequestData = (data: any): any => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  // Handle arrays of objects
  if (Array.isArray(data)) {
    return data.map(item => validateRequestData(item));
  }

  // Recursively validate nested objects
  const validated: any = {};
  for (const [key, value] of Object.entries(data)) {
    if (key === 'courseId' && typeof value === 'string') {
      validated[key] = validateCourseId(value);
    } else if (typeof value === 'object' && value !== null) {
      validated[key] = validateRequestData(value);
    } else {
      validated[key] = value;
    }
  }

  return validated;
};

/**
 * API response interceptor to handle ObjectId validation errors
 */
export const handleObjectIdError = (error: any): any => {
  if (error?.message?.includes('Cast to ObjectId failed')) {
    const courseIdMatch = error.message.match(/"([^"]+)"/);
    if (courseIdMatch) {
      const invalidId = courseIdMatch[1];
      const validId = validateCourseId(invalidId);
      
      console.error(`Invalid courseId "${invalidId}" detected. Use "${validId}" instead.`);
      
      return {
        ...error,
        isObjectIdError: true,
        invalidCourseId: invalidId,
        suggestedCourseId: validId,
        message: `Invalid courseId format. Please use "${validId}" instead of "${invalidId}"`,
      };
    }
  }
  
  return error;
};
