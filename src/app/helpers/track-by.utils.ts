export function trackById<T>(index: number, item: { id: T }): T {
  return item.id;
}
