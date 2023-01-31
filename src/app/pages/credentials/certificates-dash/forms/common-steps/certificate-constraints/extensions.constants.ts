import { helptextSystemCertificates } from 'app/helptext/system/certificates';

export enum BasicConstraint {
  Ca = 'ca',
  ExtensionCritical = 'extension_critical',
}

export const basicConstraintOptions = [
  {
    value: BasicConstraint.Ca,
    label: helptextSystemCertificates.add.basic_constraints.ca.placeholder,
    tooltip: helptextSystemCertificates.add.basic_constraints.ca.tooltip,
  },
  {
    value: BasicConstraint.ExtensionCritical,
    label: helptextSystemCertificates.add.basic_constraints.extension_critical.placeholder,
    tooltip: helptextSystemCertificates.add.basic_constraints.extension_critical.tooltip,
  },
];

export enum AuthorityKeyIdentifier {
  AuthorityCertIssuer = 'authority_cert_issuer',
  ExtensionCritical = 'extension_critical',
}

export const authorityKeyIdentifierOptions = [
  {
    value: AuthorityKeyIdentifier.AuthorityCertIssuer,
    label: helptextSystemCertificates.add.authority_key_identifier.authority_cert_issuer.placeholder,
    tooltip: helptextSystemCertificates.add.authority_key_identifier.authority_cert_issuer.tooltip,
  },
  {
    value: AuthorityKeyIdentifier.ExtensionCritical,
    label: helptextSystemCertificates.add.authority_key_identifier.extension_critical.placeholder,
    tooltip: helptextSystemCertificates.add.authority_key_identifier.extension_critical.tooltip,
  },
];

export enum KeyUsageFlag {
  DigitalSignature = 'digital_signature',
  ContentCommitment = 'content_commitment',
  KeyEncipherment = 'key_encipherment',
  DataEncipherment = 'data_encipherment',
  KeyAgreement = 'key_agreement',
  KeyCertSign = 'key_cert_sign',
  CrlSign = 'crl_sign',
  EncipherOnly = 'encipher_only',
  DecipherOnly = 'decipher_only',
  ExtensionCritical = 'extension_critical',
}

export const keyUsageOptions = [
  {
    value: KeyUsageFlag.DigitalSignature,
    label: helptextSystemCertificates.add.key_usage.digital_signature.placeholder,
    tooltip: helptextSystemCertificates.add.key_usage.digital_signature.tooltip,
  },
  {
    value: KeyUsageFlag.ContentCommitment,
    label: helptextSystemCertificates.add.key_usage.content_commitment.placeholder,
    tooltip: helptextSystemCertificates.add.key_usage.content_commitment.tooltip,
  },
  {
    value: KeyUsageFlag.KeyEncipherment,
    label: helptextSystemCertificates.add.key_usage.key_encipherment.placeholder,
    tooltip: helptextSystemCertificates.add.key_usage.key_encipherment.tooltip,
  },
  {
    value: KeyUsageFlag.DataEncipherment,
    label: helptextSystemCertificates.add.key_usage.data_encipherment.placeholder,
    tooltip: helptextSystemCertificates.add.key_usage.data_encipherment.tooltip,
  },
  {
    value: KeyUsageFlag.KeyAgreement,
    label: helptextSystemCertificates.add.key_usage.key_agreement.placeholder,
    tooltip: helptextSystemCertificates.add.key_usage.key_agreement.tooltip,
  },
  {
    value: KeyUsageFlag.KeyCertSign,
    label: helptextSystemCertificates.add.key_usage.key_cert_sign.placeholder,
    tooltip: helptextSystemCertificates.add.key_usage.key_cert_sign.tooltip,
  },
  {
    value: KeyUsageFlag.CrlSign,
    label: helptextSystemCertificates.add.key_usage.crl_sign.placeholder,
    tooltip: helptextSystemCertificates.add.key_usage.crl_sign.tooltip,
  },
  {
    value: KeyUsageFlag.EncipherOnly,
    label: helptextSystemCertificates.add.key_usage.encipher_only.placeholder,
    tooltip: helptextSystemCertificates.add.key_usage.encipher_only.tooltip,
  },
  {
    value: KeyUsageFlag.DecipherOnly,
    label: helptextSystemCertificates.add.key_usage.decipher_only.placeholder,
    tooltip: helptextSystemCertificates.add.key_usage.decipher_only.tooltip,
  },
  {
    value: KeyUsageFlag.ExtensionCritical,
    label: helptextSystemCertificates.add.key_usage.extension_critical.placeholder,
    tooltip: helptextSystemCertificates.add.key_usage.extension_critical.tooltip,
  },
];
