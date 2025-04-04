import { Codename } from 'app/enums/codename.enum';
import {
  getProductEnclosure, getProductImageSrc, getServerProduct, getSystemVersion,
} from 'app/pages/dashboard/widgets/system/common/widget-sys-info.utils';

describe('getSystemVersion', () => {
  it('should return the correct system version when valid input is provided', () => {
    expect(getSystemVersion('25.10.0-MASTER-20250126-184805', Codename.Goldeye)).toBe(
      '25.10.0-MASTER-20250126-184805 - Goldeye',
    );
  });

  it('should initial version if second argument is skipped', () => {
    expect(getSystemVersion('25.10.0-MASTER-20250126-184805')).toBe(
      '25.10.0-MASTER-20250126-184805',
    );
  });
});

describe('getServerProduct', () => {
  it('should return the correct image path for provided product', () => {
    expect(getServerProduct('TRUENAS-M40-HA')).toBe('M40');
    expect(getServerProduct('TRUENAS-F130-HA')).toBe('F130');
    expect(getServerProduct('TRUENAS-MINI-R')).toBeUndefined();
    expect(getServerProduct('TRUENAS-MINI-3.0-XL+')).toBeUndefined();
    expect(getServerProduct('FREENAS-MINI-XL')).toBeUndefined();
  });
});

describe('getProductImageSrc', () => {
  it('should return the correct image path for provided product', () => {
    expect(
      getProductImageSrc('TRUENAS-M40-HA'),
    ).toBe('assets/images/servers/M40.png');
    expect(
      getProductImageSrc('TRUENAS-MINI-R'),
    ).toBe('assets/images/servers/MINI-R.png');
    expect(
      getProductImageSrc('FREENAS-MINI-XL'),
    ).toBe('assets/images/freenas_mini_xl_cropped.png');
    expect(
      getProductImageSrc('TRUENAS-MINI-R'),
    ).toBe('assets/images/servers/MINI-R.png');
    expect(
      getProductImageSrc('FREENAS-MINI-XL'),
    ).toBe('assets/images/freenas_mini_xl_cropped.png');
  });

  it('returns null for missing product image', () => {
    expect(getProductImageSrc('UNKNOWN-PRODUCT')).toBeNull();
  });
});

describe('getProductEnclosure', () => {
  it('should return the correct product enclosure for provided product', () => {
    expect(getProductEnclosure('TRUENAS-M40-HA')).toBe('rackmount');
    expect(getProductEnclosure('FREENAS-MINI-XL')).toBe('tower');
  });
});
