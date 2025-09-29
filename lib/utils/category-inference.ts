/**
 * Infer category from pain description keywords
 *
 * NOTE: This is a temporary workaround until the agent properly categorizes
 * pain points in its tool call arguments. In a production app, categories
 * should come from the agent's analysis or a proper ML categorization service.
 *
 * @param description - The pain point description
 * @returns Inferred category
 */
export function inferCategoryFromDescription(description: string): string {
  const desc = description.toLowerCase();

  if (
    desc.includes("hire") ||
    desc.includes("recruit") ||
    desc.includes("talent") ||
    desc.includes("co-founder")
  ) {
    return "hiring";
  }

  if (
    desc.includes("market") ||
    desc.includes("visibility") ||
    desc.includes("promote") ||
    desc.includes("showcase") ||
    desc.includes("channel") ||
    desc.includes("feedback")
  ) {
    return "marketing";
  }

  if (
    desc.includes("technical") ||
    desc.includes("bug") ||
    desc.includes("code")
  ) {
    return "technical";
  }

  if (
    desc.includes("productivity") ||
    desc.includes("time") ||
    desc.includes("efficient")
  ) {
    return "productivity";
  }

  if (
    desc.includes("money") ||
    desc.includes("cost") ||
    desc.includes("afford") ||
    desc.includes("expensive")
  ) {
    return "financial";
  }

  return "other";
}
