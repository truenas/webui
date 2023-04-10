export function getCertificatePreview(certificate: string): string {
  const body = certificate.match(/-----BEGIN CERTIFICATE(?: REQUEST)?-----\s(.*)\s-----END CERTIFICATE(?: REQUEST)?-----/s)?.[1]
    || certificate;
  return body.replace(/(.{6}).*(.{6})/s, '$1......$2');
}
