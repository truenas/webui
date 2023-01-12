import { helptextSystemCertificates } from 'app/helptext/system/certificates';

export const basicConstraintOptions = [
  {
    value: 'ca',
    label: helptextSystemCertificates.add.basic_constraints.ca.placeholder,
    tooltip: helptextSystemCertificates.add.basic_constraints.ca.tooltip,
  },
  {
    value: 'extension_critical',
    label: helptextSystemCertificates.add.basic_constraints.extension_critical.placeholder,
    tooltip: helptextSystemCertificates.add.basic_constraints.extension_critical.tooltip,
  },
];

export const authorityKeyIdentifierOptions = [
  {
    value: 'authority_cert_issuer',
    label: helptextSystemCertificates.add.authority_key_identifier.authority_cert_issuer.placeholder,
    tooltip: helptextSystemCertificates.add.authority_key_identifier.authority_cert_issuer.tooltip,
  },
  {
    value: 'extension_critical',
    label: helptextSystemCertificates.add.authority_key_identifier.extension_critical.placeholder,
    tooltip: helptextSystemCertificates.add.authority_key_identifier.extension_critical.tooltip,
  },
];

export const keyUsageOptions = [
  {
    value: 'digital_signature',
    label: helptextSystemCertificates.add.key_usage.digital_signature.placeholder,
    tooltip: helptextSystemCertificates.add.key_usage.digital_signature.tooltip,
  },
  {
    value: 'content_commitment',
    label: helptextSystemCertificates.add.key_usage.content_commitment.placeholder,
    tooltip: helptextSystemCertificates.add.key_usage.content_commitment.tooltip,
  },
  {
    value: 'key_encipherment',
    label: helptextSystemCertificates.add.key_usage.key_encipherment.placeholder,
    tooltip: helptextSystemCertificates.add.key_usage.key_encipherment.tooltip,
  },
  {
    value: 'data_encipherment',
    label: helptextSystemCertificates.add.key_usage.data_encipherment.placeholder,
    tooltip: helptextSystemCertificates.add.key_usage.data_encipherment.tooltip,
  },
  {
    value: 'key_agreement',
    label: helptextSystemCertificates.add.key_usage.key_agreement.placeholder,
    tooltip: helptextSystemCertificates.add.key_usage.key_agreement.tooltip,
  },
  {
    value: 'key_cert_sign',
    label: helptextSystemCertificates.add.key_usage.key_cert_sign.placeholder,
    tooltip: helptextSystemCertificates.add.key_usage.key_cert_sign.tooltip,
  },
  {
    value: 'crl_sign',
    label: helptextSystemCertificates.add.key_usage.crl_sign.placeholder,
    tooltip: helptextSystemCertificates.add.key_usage.crl_sign.tooltip,
  },
  {
    value: 'encipher_only',
    label: helptextSystemCertificates.add.key_usage.encipher_only.placeholder,
    tooltip: helptextSystemCertificates.add.key_usage.encipher_only.tooltip,
  },
  {
    value: 'decipher_only',
    label: helptextSystemCertificates.add.key_usage.decipher_only.placeholder,
    tooltip: helptextSystemCertificates.add.key_usage.decipher_only.tooltip,
  },
  {
    value: 'extension_critical',
    label: helptextSystemCertificates.add.key_usage.extension_critical.placeholder,
    tooltip: helptextSystemCertificates.add.key_usage.extension_critical.tooltip,
  },
];
