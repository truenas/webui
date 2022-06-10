export function isRootDataset(dataset: { mountpoint: string }): boolean {
  return (dataset.mountpoint.match(/\//g) || []).length <= 2;
}
