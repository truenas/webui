import { environment } from 'environments/environment';
import { ProductType } from 'app/enums/product-type.enum';
import { License, SystemInfo } from 'app/interfaces/system-info.interface';
import { SystemInfoState } from 'app/store/system-info/system-info.reducer';
import {
  selectBrandedProductType, selectCopyrightHtml, selectHasCommunityBranding,
} from 'app/store/system-info/system-info.selectors';

describe('system-info selectors', () => {
  const license = { id: 'license-1' } as License;

  const makeState = (productType: ProductType | null, systemLicense: License | null): SystemInfoState => ({
    productType,
    systemInfo: { license: systemLicense } as SystemInfo,
    isIxHardware: false,
    buildYear: 2026,
  });

  describe('selectBrandedProductType', () => {
    it('keeps Community Edition as is', () => {
      expect(selectBrandedProductType.projector(ProductType.CommunityEdition, null))
        .toBe(ProductType.CommunityEdition);
      expect(selectBrandedProductType.projector(ProductType.CommunityEdition, license))
        .toBe(ProductType.CommunityEdition);
    });

    it('keeps licensed Enterprise as Enterprise', () => {
      expect(selectBrandedProductType.projector(ProductType.Enterprise, license)).toBe(ProductType.Enterprise);
    });

    it('brands unlicensed Enterprise as Community Edition', () => {
      expect(selectBrandedProductType.projector(ProductType.Enterprise, null)).toBe(ProductType.CommunityEdition);
    });

    it('returns null while product type is unknown', () => {
      expect(selectBrandedProductType.projector(null, null)).toBeNull();
    });

    it('derives license from system info state', () => {
      expect(selectBrandedProductType({ systemInfo: makeState(ProductType.Enterprise, null) }))
        .toBe(ProductType.CommunityEdition);
      expect(selectBrandedProductType({ systemInfo: makeState(ProductType.Enterprise, license) }))
        .toBe(ProductType.Enterprise);
    });
  });

  describe('selectHasCommunityBranding', () => {
    it('is true only for a Community Edition branded product type', () => {
      expect(selectHasCommunityBranding.projector(ProductType.CommunityEdition)).toBe(true);
      expect(selectHasCommunityBranding.projector(ProductType.Enterprise)).toBe(false);
      expect(selectHasCommunityBranding.projector(null)).toBe(false);
    });
  });

  describe('selectCopyrightHtml', () => {
    it('uses the branded product type', () => {
      expect(selectCopyrightHtml({ systemInfo: makeState(ProductType.Enterprise, null) }))
        .toBe(`TrueNAS® Community Edition <br /> © ${environment.buildYear}`);
      expect(selectCopyrightHtml({ systemInfo: makeState(ProductType.Enterprise, license) }))
        .toBe(`TrueNAS® Enterprise <br /> © ${environment.buildYear}`);
    });
  });
});
