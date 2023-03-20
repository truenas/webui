export function getCertificatePreview(certificate: string): string {
  const body = certificate.match(/-----BEGIN CERTIFICATE-----\s(.*)\s-----END CERTIFICATE-----/s)?.[1]
    || certificate;
  return body.replace(/(.{6}).*(.{6})/s, '$1......$2');
}
