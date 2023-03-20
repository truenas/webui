import { getCertificatePreview } from 'app/pages/credentials/certificates-dash/utils/get-certificate-preview.utils';

describe('getCertificatePreview', () => {
  it('should return certificate preview', () => {
    const certificate = '-----BEGIN CERTIFICATE-----\n'
      + 'ABCDEFGHAwIBAgIJAKZQZ2Z0Z0ZmMA0GCSqGSIb3DQEBCwUA0987654321\n'
      + '-----END CERTIFICATE-----';

    expect(getCertificatePreview(certificate)).toBe('ABCDEF......654321');
  });
});
