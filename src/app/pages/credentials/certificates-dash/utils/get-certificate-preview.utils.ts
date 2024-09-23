export function getCertificatePreview(certificate: string): string {
  const body = certificate.match(/-----BEGIN CERTIFICATE(?: REQUEST)?-----\s([\s\S]*)\s-----END CERTIFICATE(?: REQUEST)?-----/)?.[1]
    || certificate;

  return body.replace(/(.{6})[\s\S]*(.{6})/, '$1......$2');
}
