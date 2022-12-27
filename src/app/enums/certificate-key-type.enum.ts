export enum CertificateKeyType {
  Rsa = 'RSA',
  Ec = 'EC',
}

export const certificateKeyTypeLabels = new Map<CertificateKeyType, string>([
  [CertificateKeyType.Rsa, 'RSA'],
  [CertificateKeyType.Ec, 'EC'],
]);
