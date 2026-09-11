import { environment } from 'environments/environment';
import { ProductType } from 'app/enums/product-type.enum';
import { License, SystemInfo } from 'app/interfaces/system-info.interface';
import { SystemInfoState } from 'app/store/system-info/system-info.reducer';
import {
  selectBrandedProductType, selectCopyrightHtml, selectHasCommunityBranding, selectHasEnterpriseBranding,
} from 'app/store/system-info/system-info.selectors';

describe('system-info selectors', () => {
  const license = { id: 'license-1' } as License;
  const licensed = { license } as SystemInfo;
  const unlicensed = { license: null } as SystemInfo;

  const makeState = (
    productType: ProductType | null,
    systemInfo: SystemInfo | null,
    licenseLoadFailed = false,
  ): SystemInfoState => ({
    productType,
    systemInfo,
    isIxHardware: false,
    buildYear: 2026,
    licenseLoadFailed,
  });

  describe('selectBrandedProductType', () => {
    it('keeps Community Edition as is, even before system info is loaded', () => {
      expect(selectBrandedProductType.projector(ProductType.CommunityEdition, null, false))
        .toBe(ProductType.CommunityEdition);
      expect(selectBrandedProductType.projector(ProductType.CommunityEdition, licensed, false))
        .toBe(ProductType.CommunityEdition);
    });

    it('keeps licensed Enterprise as Enterprise', () => {
      expect(selectBrandedProductType.projector(ProductType.Enterprise, licensed, false)).toBe(ProductType.Enterprise);
    });

    it('brands unlicensed Enterprise as Community Edition', () => {
      expect(selectBrandedProductType.projector(ProductType.Enterprise, unlicensed, false))
        .toBe(ProductType.CommunityEdition);
    });

    it('returns null for Enterprise until system info (and so the license) is loaded', () => {
      expect(selectBrandedProductType.projector(ProductType.Enterprise, null, false)).toBeNull();
    });

    it('keeps Enterprise branding when the license fetch failed', () => {
      expect(selectBrandedProductType.projector(ProductType.Enterprise, unlicensed, true)).toBe(ProductType.Enterprise);
    });

    it('returns null while product type is unknown', () => {
      expect(selectBrandedProductType.projector(null, null, false)).toBeNull();
      expect(selectBrandedProductType.projector(null, licensed, false)).toBeNull();
    });

    it('derives inputs from system info state', () => {
      expect(selectBrandedProductType({ systemInfo: makeState(ProductType.Enterprise, unlicensed) }))
        .toBe(ProductType.CommunityEdition);
      expect(selectBrandedProductType({ systemInfo: makeState(ProductType.Enterprise, licensed) }))
        .toBe(ProductType.Enterprise);
      expect(selectBrandedProductType({ systemInfo: makeState(ProductType.Enterprise, unlicensed, true) }))
        .toBe(ProductType.Enterprise);
    });
  });

  describe('selectHasCommunityBranding / selectHasEnterpriseBranding', () => {
    it('reflect the branded product type', () => {
      expect(selectHasCommunityBranding.projector(ProductType.CommunityEdition)).toBe(true);
      expect(selectHasCommunityBranding.projector(ProductType.Enterprise)).toBe(false);
      expect(selectHasCommunityBranding.projector(null)).toBe(false);

      expect(selectHasEnterpriseBranding.projector(ProductType.Enterprise)).toBe(true);
      expect(selectHasEnterpriseBranding.projector(ProductType.CommunityEdition)).toBe(false);
      expect(selectHasEnterpriseBranding.projector(null)).toBe(false);
    });
  });

  describe('selectCopyrightHtml', () => {
    it('uses the branded product type', () => {
      expect(selectCopyrightHtml({ systemInfo: makeState(ProductType.Enterprise, unlicensed) }))
        .toBe(`TrueNAS® Community Edition <br /> © ${environment.buildYear}`);
      expect(selectCopyrightHtml({ systemInfo: makeState(ProductType.Enterprise, licensed) }))
        .toBe(`TrueNAS® Enterprise <br /> © ${environment.buildYear}`);
    });

    it('omits the edition while an Enterprise license is still unknown', () => {
      expect(selectCopyrightHtml({ systemInfo: makeState(ProductType.Enterprise, null) }))
        .toBe(`TrueNAS® <br /> © ${environment.buildYear}`);
    });
  });
});
