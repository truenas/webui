import { LicenseType } from 'app/enums/license-type.enum';
import { getProductTypeForLicense, ProductType } from 'app/enums/product-type.enum';

describe('getProductTypeForLicense', () => {
  it('brands enterprise license types as Enterprise', () => {
    expect(getProductTypeForLicense(LicenseType.EnterpriseHa)).toBe(ProductType.Enterprise);
    expect(getProductTypeForLicense(LicenseType.EnterpriseSingle)).toBe(ProductType.Enterprise);
    expect(getProductTypeForLicense(LicenseType.Enterprise)).toBe(ProductType.Enterprise);
  });

  it('brands a commercial license as Commercial', () => {
    expect(getProductTypeForLicense(LicenseType.Commercial)).toBe(ProductType.Commercial);
  });

  it('brands a community license, no license, or an unrecognized type as Community Edition', () => {
    expect(getProductTypeForLicense(LicenseType.Community)).toBe(ProductType.CommunityEdition);
    expect(getProductTypeForLicense(null)).toBe(ProductType.CommunityEdition);
    expect(getProductTypeForLicense('SOME_FUTURE_TYPE')).toBe(ProductType.CommunityEdition);
  });
});
