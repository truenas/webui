import { helptextSystemCertificates } from 'app/helptext/system/certificates';

export enum BasicConstraint {
  Ca = 'ca',
  ExtensionCritical = 'extension_critical',
}

export const basicConstraintOptions = [
  {
    value: BasicConstraint.Ca,
    label: helptextSystemCertificates.add.basicConstraints.ca.placeholder,
    tooltip: helptextSystemCertificates.add.basicConstraints.ca.tooltip,
  },
  {
    value: BasicConstraint.ExtensionCritical,
    label: helptextSystemCertificates.add.basicConstraints.extensionCritical.placeholder,
    tooltip: helptextSystemCertificates.add.basicConstraints.extensionCritical.tooltip,
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
    label: helptextSystemCertificates.add.keyUsage.digitalSignature.placeholder,
    tooltip: helptextSystemCertificates.add.keyUsage.digitalSignature.tooltip,
  },
  {
    value: KeyUsageFlag.ContentCommitment,
    label: helptextSystemCertificates.add.keyUsage.contentCommitment.placeholder,
    tooltip: helptextSystemCertificates.add.keyUsage.contentCommitment.tooltip,
  },
  {
    value: KeyUsageFlag.KeyEncipherment,
    label: helptextSystemCertificates.add.keyUsage.key_Encipherment.placeholder,
    tooltip: helptextSystemCertificates.add.keyUsage.key_Encipherment.tooltip,
  },
  {
    value: KeyUsageFlag.DataEncipherment,
    label: helptextSystemCertificates.add.keyUsage.dataEncipherment.placeholder,
    tooltip: helptextSystemCertificates.add.keyUsage.dataEncipherment.tooltip,
  },
  {
    value: KeyUsageFlag.KeyAgreement,
    label: helptextSystemCertificates.add.keyUsage.keyAgreement.placeholder,
    tooltip: helptextSystemCertificates.add.keyUsage.keyAgreement.tooltip,
  },
  {
    value: KeyUsageFlag.KeyCertSign,
    label: helptextSystemCertificates.add.keyUsage.keyCertSign.placeholder,
    tooltip: helptextSystemCertificates.add.keyUsage.keyCertSign.tooltip,
  },
  {
    value: KeyUsageFlag.CrlSign,
    label: helptextSystemCertificates.add.keyUsage.crlSign.placeholder,
    tooltip: helptextSystemCertificates.add.keyUsage.crlSign.tooltip,
  },
  {
    value: KeyUsageFlag.EncipherOnly,
    label: helptextSystemCertificates.add.keyUsage.encipherOnly.placeholder,
    tooltip: helptextSystemCertificates.add.keyUsage.encipherOnly.tooltip,
  },
  {
    value: KeyUsageFlag.DecipherOnly,
    label: helptextSystemCertificates.add.keyUsage.decipherOnly.placeholder,
    tooltip: helptextSystemCertificates.add.keyUsage.decipherOnly.tooltip,
  },
  {
    value: KeyUsageFlag.ExtensionCritical,
    label: helptextSystemCertificates.add.keyUsage.extensionCritical.placeholder,
    tooltip: helptextSystemCertificates.add.keyUsage.extensionCritical.tooltip,
  },
];
