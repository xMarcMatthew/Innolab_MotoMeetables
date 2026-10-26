// What other users see: "Marc Bagasbas" -> "Marc B." (Decisions, Oct 27: full name stored, abbreviation shown).
export function shortName(fullName: string | null | undefined): string {
  const parts = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Rider";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}
