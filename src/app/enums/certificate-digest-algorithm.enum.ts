export enum CertificateDigestAlgorithm {
  Sha1 = 'SHA1',
  Sha224 = 'SHA224',
  Sha256 = 'SHA256',
  Sha384 = 'SHA384',
  Sha512 = 'SHA512',
}

export const certificateDigestAlgorithmLabels = new Map<CertificateDigestAlgorithm, string>([
  [CertificateDigestAlgorithm.Sha1, 'SHA1'],
  [CertificateDigestAlgorithm.Sha224, 'SHA224'],
  [CertificateDigestAlgorithm.Sha256, 'SHA256'],
  [CertificateDigestAlgorithm.Sha384, 'SHA384'],
  [CertificateDigestAlgorithm.Sha512, 'SHA512'],
]);

export const certificateKeyLengths = [
  { label: '1024', value: 1024 },
  { label: '2048', value: 2048 },
  { label: '4096', value: 4096 },
];
