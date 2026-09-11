import { ProductType } from 'app/enums/product-type.enum';
import { License, SystemInfo } from 'app/interfaces/system-info.interface';
import { SystemInfoState } from 'app/store/system-info/system-info.reducer';
import { selectHasCommunityBranding } from 'app/store/system-info/system-info.selectors';

describe('system-info selectors', () => {
  describe('selectHasCommunityBranding', () => {
    const makeState = (productType: ProductType | null, license: License | null): SystemInfoState => ({
      productType,
      systemInfo: { license } as SystemInfo,
      isIxHardware: false,
      buildYear: 2026,
    });

    it('returns true for Community Edition', () => {
      expect(selectHasCommunityBranding.projector(ProductType.CommunityEdition, null)).toBe(true);
      expect(selectHasCommunityBranding.projector(ProductType.CommunityEdition, { id: 'l1' } as License)).toBe(true);
    });

    it('returns true for Enterprise without a license', () => {
      expect(selectHasCommunityBranding.projector(ProductType.Enterprise, null)).toBe(true);
    });

    it('returns false for licensed Enterprise', () => {
      expect(selectHasCommunityBranding.projector(ProductType.Enterprise, { id: 'l1' } as License)).toBe(false);
    });

    it('returns false while product type is unknown', () => {
      expect(selectHasCommunityBranding.projector(null, null)).toBe(false);
    });

    it('derives license from system info state', () => {
      const unlicensedEnterprise = { systemInfo: makeState(ProductType.Enterprise, null) };
      const licensedEnterprise = { systemInfo: makeState(ProductType.Enterprise, { id: 'l1' } as License) };

      expect(selectHasCommunityBranding(unlicensedEnterprise)).toBe(true);
      expect(selectHasCommunityBranding(licensedEnterprise)).toBe(false);
    });
  });
});
