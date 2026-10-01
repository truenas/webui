import { ApiDate } from 'app/interfaces/api-date.interface';
import {
  getDaysUntilLicenseExpiration, getProductEnclosure, getProductImageSrc, getServerProduct,
} from 'app/pages/dashboard/widgets/system/common/widget-sys-info.utils';

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

describe('getDaysUntilLicenseExpiration', () => {
  const expiresAt = { $type: 'date', $value: '2026-09-30' } as ApiDate;

  it('counts the whole day, whatever time of day it is asked', () => {
    expect(getDaysUntilLicenseExpiration(expiresAt, Date.parse('2026-09-29T00:00:00Z'))).toBe(1);
    expect(getDaysUntilLicenseExpiration(expiresAt, Date.parse('2026-09-29T13:00:00Z'))).toBe(1);
    expect(getDaysUntilLicenseExpiration(expiresAt, Date.parse('2026-09-29T23:59:59Z'))).toBe(1);
  });

  it('returns 0 for the whole of the last day the contract is in force', () => {
    expect(getDaysUntilLicenseExpiration(expiresAt, Date.parse('2026-09-30T00:00:00Z'))).toBe(0);
    expect(getDaysUntilLicenseExpiration(expiresAt, Date.parse('2026-09-30T18:00:00Z'))).toBe(0);
  });

  it('goes negative only once the contract has lapsed', () => {
    expect(getDaysUntilLicenseExpiration(expiresAt, Date.parse('2026-10-01T00:00:00Z'))).toBe(-1);
    expect(getDaysUntilLicenseExpiration(expiresAt, Date.parse('2026-10-08T12:00:00Z'))).toBe(-8);
  });

  it('counts longer contracts', () => {
    expect(getDaysUntilLicenseExpiration(expiresAt, Date.parse('2026-09-16T09:00:00Z'))).toBe(14);
  });

  it('returns null when there is no expiration date', () => {
    expect(getDaysUntilLicenseExpiration(null, Date.parse('2026-09-29T13:00:00Z'))).toBeNull();
    expect(getDaysUntilLicenseExpiration(undefined, Date.parse('2026-09-29T13:00:00Z'))).toBeNull();
    expect(getDaysUntilLicenseExpiration({ $type: 'date', $value: '' } as ApiDate, 0)).toBeNull();
  });
});
