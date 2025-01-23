export enum ProductType {
  CommunityEdition = 'COMMUNITY_EDITION',
  Enterprise = 'ENTERPRISE',
}

export const productTypeLabels = new Map<ProductType, string>([
  [ProductType.CommunityEdition, ''],
  [ProductType.Enterprise, 'ENTERPRISE'],
]);
