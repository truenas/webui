import { LicenseType } from 'app/enums/license-type.enum';

/**
 * Edition the UI brands the system as. Derived from the installed license type alone,
 * whatever the hardware: no license (or an unrecognized type) brands as Community Edition.
 */
export enum ProductType {
  CommunityEdition = 'COMMUNITY_EDITION',
  Commercial = 'COMMERCIAL',
  Enterprise = 'ENTERPRISE',
}

export const productTypeLabels = new Map<ProductType, string>([
  [ProductType.CommunityEdition, 'Community Edition'],
  [ProductType.Commercial, 'Commercial'],
  [ProductType.Enterprise, 'Enterprise'],
]);

export function getProductTypeForLicense(licenseType: string | null): ProductType {
  // Middleware leaves the type an open string; anything unrecognized falls to the default.
  switch (licenseType as LicenseType | null) {
    case LicenseType.Enterprise:
    case LicenseType.EnterpriseHa:
    case LicenseType.EnterpriseSingle:
      return ProductType.Enterprise;
    case LicenseType.Commercial:
      return ProductType.Commercial;
    default:
      return ProductType.CommunityEdition;
  }
}
