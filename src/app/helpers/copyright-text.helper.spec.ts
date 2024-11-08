import { getCopyrightText } from 'app/helpers/copyright-text.helper';

describe('getCopyrightText', () => {
  it('should return the correct copyright text', () => {
    expect(getCopyrightText(false, 2024)).toBe('TrueNAS ® © 2024');
  });

  it('should return the correct enterprise copyright text', () => {
    expect(getCopyrightText(true, 2024)).toBe('TrueNAS ENTERPRISE ® © 2024');
  });
});
