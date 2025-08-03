/**
 * DEPRECATED - DO NOT USE DIRECTLY
 * 
 * This context has been decomposed into multiple smaller contexts:
 * - ProblemContext
 * - SolutionContext
 * - FeedbackContext
 * - AdaptiveContext
 * - ChatContext
 * 
 * For backward compatibility, import from useParsonsContext instead:
 * import { useParsonsContext } from '@/contexts/useParsonsContext';
 * 
 * The original implementation has been saved in ParsonsContext.backup.tsx
 * This file now re-exports from useParsonsContext for compatibility
 */

// Re-export for backward compatibility
export { useParsonsContext, useParsonsDebug } from './useParsonsContext';
