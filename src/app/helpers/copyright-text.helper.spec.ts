import { ProductType } from 'app/enums/product-type.enum';
import { getCopyrightText } from 'app/helpers/copyright-text.helper';

describe('getCopyrightText', () => {
  it('general: copyright text', () => {
    expect(getCopyrightText()).toBe('TrueNAS ® © 2024');
  });

  it('community edition: copyright text', () => {
    expect(getCopyrightText(ProductType.Scale)).toBe('TrueNAS Community Edition ® © 2024');
  });

  it('enterprise: copyright text', () => {
    expect(getCopyrightText(ProductType.ScaleEnterprise)).toBe('TrueNAS Enterprise ® © 2024');
  });
});
