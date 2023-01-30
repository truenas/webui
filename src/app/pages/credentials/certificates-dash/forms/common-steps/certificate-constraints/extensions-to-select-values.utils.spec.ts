import {
  extensionsToSelectValues,
} from 'app/pages/credentials/certificates-dash/forms/common-steps/certificate-constraints/extensions-to-select-values.utils';

describe('extensionsToSelectValues', () => {
  it('converts a dictionary of boolean keys with true value to an array of strings', () => {
    expect(extensionsToSelectValues({
      digital_signature: true,
      content_commitment: false,
      key_agreement: true,
    })).toEqual(['digital_signature', 'key_agreement']);
  });
});
