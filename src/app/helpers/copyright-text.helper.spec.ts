import { environment } from 'environments/environment';
import { ProductType } from 'app/enums/product-type.enum';
import { getCopyrightHtml } from 'app/helpers/copyright-text.helper';

const buildYear = environment.buildYear;

describe('getCopyrightHtml', () => {
  it('general: copyright text', () => {
    expect(getCopyrightHtml()).toBe(`TrueNAS® <br /> © ${buildYear}`);
  });

  it('community edition: copyright text', () => {
    expect(getCopyrightHtml(ProductType.CommunityEdition)).toBe(`TrueNAS® Community Edition <br /> © ${buildYear}`);
  });

  it('enterprise: copyright text', () => {
    expect(getCopyrightHtml(ProductType.Enterprise)).toBe(`TrueNAS® Enterprise <br /> © ${buildYear}`);
  });
});
