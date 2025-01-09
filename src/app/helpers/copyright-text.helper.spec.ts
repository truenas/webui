import { ProductType } from 'app/enums/product-type.enum';
import { getCopyrightText } from 'app/helpers/copyright-text.helper';

describe('getCopyrightText', () => {
  it('should return the correct copyright text', () => {
    expect(getCopyrightText(ProductType.Scale, 2024)).toBe('TrueNAS Community Edition ® © 2024');
  });

  it('should return the correct enterprise copyright text', () => {
    expect(getCopyrightText(ProductType.ScaleEnterprise, 2024)).toBe('TrueNAS Enterprise ® © 2024');
  });
});
