export enum ProductType {
  Scale = 'SCALE',
  ScaleEnterprise = 'SCALE_ENTERPRISE',
}

export const productTypeLabels = new Map<ProductType, string>([
  [ProductType.Scale, 'Community  Edition'],
  [ProductType.ScaleEnterprise, 'Enterprise'],
]);
