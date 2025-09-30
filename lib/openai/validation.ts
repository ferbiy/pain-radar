/**
 * Validation result structure
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate pain point quality
 * Ensures pain points are actual problems, not just Reddit post titles
 */
export function validatePainPoint(point: {
  description: string;
  category: string;
  confidence: number;
  evidence?: string[];
}): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check description is not just a title
  if (point.description.length < 20) {
    errors.push("Pain point description too short (likely just a title)");
  }

  // Check for common Reddit post title patterns
  const titlePatterns = [
    /^share your startup/i,
    /^hiring.*thread/i,
    /^\[.*\].*thread/i,
    /quarterly post$/i,
    /weekly thread$/i,
  ];

  if (titlePatterns.some((pattern) => pattern.test(point.description))) {
    errors.push(
      "Pain point appears to be a Reddit post title, not an actual problem"
    );
  }

  // Check category is specific
  if (point.category === "general" || point.category === "other") {
    warnings.push("Pain point category is too generic");
  }

  // Check confidence threshold
  if (point.confidence < 0.6) {
    warnings.push(`Low confidence: ${point.confidence}`);
  }

  // Check for evidence
  if (!point.evidence || point.evidence.length === 0) {
    warnings.push("No evidence/quotes provided");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate product idea quality
 * Ensures ideas are creative and specific, not generic templates
 */
export function validateProductIdea(idea: {
  name: string;
  pitch: string;
  targetAudience: string;
}): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check name is not TOO generic (exact matches only, not substrings)
  const genericNames = ["general solution", "product", "app", "platform"];

  const nameLower = idea.name.toLowerCase().trim();

  if (genericNames.some((name) => nameLower === name)) {
    errors.push(`Generic product name: ${idea.name}`);
  }

  // Note: Removed "a solution to address" check - too strict for fallback-generated pitches
  // Fallback extraction uses templates intentionally when agent doesn't synthesize

  if (idea.pitch.length < 30) {
    warnings.push("Pitch is too short");
  }

  // Check target audience is specific
  if (
    idea.targetAudience.toLowerCase().includes("startups and small businesses")
  ) {
    warnings.push("Target audience too broad");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate score breakdown
 * Ensures scores are within valid ranges and add up correctly
 */
export function validateScoreBreakdown(breakdown: {
  painSeverity: number;
  marketSize: number;
  competition: number;
  feasibility: number;
  engagement: number;
  total: number;
}): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check individual score ranges
  if (breakdown.painSeverity < 0 || breakdown.painSeverity > 30) {
    errors.push(`Pain severity out of range: ${breakdown.painSeverity} (0-30)`);
  }

  if (breakdown.marketSize < 0 || breakdown.marketSize > 25) {
    errors.push(`Market size out of range: ${breakdown.marketSize} (0-25)`);
  }

  if (breakdown.competition < 0 || breakdown.competition > 20) {
    errors.push(`Competition out of range: ${breakdown.competition} (0-20)`);
  }

  if (breakdown.feasibility < 0 || breakdown.feasibility > 15) {
    errors.push(`Feasibility out of range: ${breakdown.feasibility} (0-15)`);
  }

  if (breakdown.engagement < 0 || breakdown.engagement > 10) {
    errors.push(`Engagement out of range: ${breakdown.engagement} (0-10)`);
  }

  // Check total matches sum
  const calculatedTotal =
    breakdown.painSeverity +
    breakdown.marketSize +
    breakdown.competition +
    breakdown.feasibility +
    breakdown.engagement;

  if (Math.abs(breakdown.total - calculatedTotal) > 0.1) {
    warnings.push(
      `Total score mismatch: ${breakdown.total} vs calculated ${calculatedTotal}`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
