export enum ProductType {
  Scale = 'SCALE',
  ScaleEnterprise = 'SCALE_ENTERPRISE',
  Core = 'CORE',
  Enterprise = 'ENTERPRISE',
}

export const productTypeLabels = new Map<ProductType, string>([
  [ProductType.Scale, 'SCALE'],
  [ProductType.ScaleEnterprise, 'SCALE ENTERPRISE'],
  [ProductType.Core, 'CORE'],
  [ProductType.Enterprise, 'ENTERPRISE'],
]);
