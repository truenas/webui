import { Codename } from 'app/enums/codename.enum';
import {
  getMiniImagePath, getProductEnclosure, getProductImage, getServerProduct, getSystemVersion,
  isRackmount,
} from 'app/pages/dashboard/widgets/system/common/widget-sys-info.utils';

describe('getSystemVersion', () => {
  it('should return the correct system version when valid input is provided', () => {
    expect(getSystemVersion('TrueNAS-SCALE-24.10.0-MASTER-20240301-233006', Codename.ElectricEel)).toBe(
      'ElectricEel-24.10.0-MASTER-20240301-233006',
    );
  });

  it('should initial version if second argument is skipped', () => {
    expect(getSystemVersion('TrueNAS-SCALE-24.10.0-MASTER-20240301-233006')).toBe(
      'TrueNAS-SCALE-24.10.0-MASTER-20240301-233006',
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

describe('getProductImage', () => {
  it('should return the correct image path for provided product', () => {
    expect(getProductImage('TRUENAS-M40-HA')).toBe('/servers/M40.png');
    expect(getProductImage('TRUENAS-MINI-R')).toBe('servers/MINI-R.png');
    expect(getProductImage('FREENAS-MINI-XL')).toBe('freenas_mini_xl_cropped.png');
  });
});

describe('getMiniImagePath', () => {
  it('should return the correct image path for provided product', () => {
    expect(getMiniImagePath('TRUENAS-M40-HA')).toBeUndefined();
    expect(getMiniImagePath('TRUENAS-MINI-R')).toBe('servers/MINI-R.png');
    expect(getMiniImagePath('FREENAS-MINI-XL')).toBe('freenas_mini_xl_cropped.png');
  });
});

describe('getProductEnclosure', () => {
  it('should return the correct product enclosure for provided product', () => {
    expect(getProductEnclosure('TRUENAS-M40-HA')).toBe('rackmount');
    expect(getProductEnclosure('FREENAS-MINI-XL')).toBe('tower');
  });
});

describe('isRackmount', () => {
  it('should return the correct image path for provided product', () => {
    expect(isRackmount('FREENAS-MINI-XL')).toBeFalsy();
    expect(isRackmount('TRUENAS-MINI-R')).toBeTruthy();
  });
});
