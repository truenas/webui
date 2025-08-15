export function getCertificatePreview(certificate: string): string {
  const body = /-----BEGIN CERTIFICATE(?: REQUEST)?-----\s([\s\S]*)\s-----END CERTIFICATE(?: REQUEST)?-----/.exec(certificate)?.[1]
    || certificate;

  return body.replace(/(.{6})[\s\S]*(.{6})/, '$1......$2');
}
