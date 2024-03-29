export function generateIdFromHierarchy(hierarchy: string[]): string {
  const id = hierarchy.join('-').toLowerCase();
  return id.replace(/\s+/g, '-');
}
