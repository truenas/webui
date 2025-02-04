export enum ProductType {
  CommunityEdition = 'COMMUNITY_EDITION',
  Enterprise = 'ENTERPRISE',
}

export const productTypeLabels = new Map<ProductType, string>([
  [ProductType.CommunityEdition, 'Community Edition'],
  [ProductType.Enterprise, 'Enterprise'],
]);
