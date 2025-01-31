import { environment } from 'environments/environment';
import { ProductType } from 'app/enums/product-type.enum';
import { getCopyrightText } from 'app/helpers/copyright-text.helper';

const buildYear = environment.buildYear;

describe('getCopyrightText', () => {
  it('general: copyright text', () => {
    expect(getCopyrightText()).toBe(`TrueNAS ® © ${buildYear}`);
  });

  it('community edition: copyright text', () => {
    expect(getCopyrightText(ProductType.CommunityEdition)).toBe(`TrueNAS Community Edition ® © ${buildYear}`);
  });

  it('enterprise: copyright text', () => {
    expect(getCopyrightText(ProductType.Enterprise)).toBe(`TrueNAS Enterprise ® © ${buildYear}`);
  });
});
