import { helptextSystemCertificates } from 'app/helptext/system/certificates';

export enum BasicConstraint {
  Ca = 'ca',
  ExtensionCritical = 'extension_critical',
}

export const basicConstraintOptions = [
  {
    value: BasicConstraint.Ca,
    label: helptextSystemCertificates.add.basicConstraints.ca.label,
    tooltip: helptextSystemCertificates.add.basicConstraints.ca.tooltip,
  },
  {
    value: BasicConstraint.ExtensionCritical,
    label: helptextSystemCertificates.add.basicConstraints.extensionCritical.label,
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
    label: helptextSystemCertificates.add.keyUsage.digitalSignature.label,
    tooltip: helptextSystemCertificates.add.keyUsage.digitalSignature.tooltip,
  },
  {
    value: KeyUsageFlag.ContentCommitment,
    label: helptextSystemCertificates.add.keyUsage.contentCommitment.label,
    tooltip: helptextSystemCertificates.add.keyUsage.contentCommitment.tooltip,
  },
  {
    value: KeyUsageFlag.KeyEncipherment,
    label: helptextSystemCertificates.add.keyUsage.keyEncipherment.label,
    tooltip: helptextSystemCertificates.add.keyUsage.keyEncipherment.tooltip,
  },
  {
    value: KeyUsageFlag.DataEncipherment,
    label: helptextSystemCertificates.add.keyUsage.dataEncipherment.label,
    tooltip: helptextSystemCertificates.add.keyUsage.dataEncipherment.tooltip,
  },
  {
    value: KeyUsageFlag.KeyAgreement,
    label: helptextSystemCertificates.add.keyUsage.keyAgreement.label,
    tooltip: helptextSystemCertificates.add.keyUsage.keyAgreement.tooltip,
  },
  {
    value: KeyUsageFlag.KeyCertSign,
    label: helptextSystemCertificates.add.keyUsage.keyCertSign.label,
    tooltip: helptextSystemCertificates.add.keyUsage.keyCertSign.tooltip,
  },
  {
    value: KeyUsageFlag.CrlSign,
    label: helptextSystemCertificates.add.keyUsage.crlSign.label,
    tooltip: helptextSystemCertificates.add.keyUsage.crlSign.tooltip,
  },
  {
    value: KeyUsageFlag.EncipherOnly,
    label: helptextSystemCertificates.add.keyUsage.encipherOnly.label,
    tooltip: helptextSystemCertificates.add.keyUsage.encipherOnly.tooltip,
  },
  {
    value: KeyUsageFlag.DecipherOnly,
    label: helptextSystemCertificates.add.keyUsage.decipherOnly.label,
    tooltip: helptextSystemCertificates.add.keyUsage.decipherOnly.tooltip,
  },
  {
    value: KeyUsageFlag.ExtensionCritical,
    label: helptextSystemCertificates.add.keyUsage.extensionCritical.label,
    tooltip: helptextSystemCertificates.add.keyUsage.extensionCritical.tooltip,
  },
];
