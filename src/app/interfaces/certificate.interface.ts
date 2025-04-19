import { CertificateCreateType } from 'app/enums/certificate-create-type.enum';
import { CertificateDigestAlgorithm } from 'app/enums/certificate-digest-algorithm.enum';
import { CertificateKeyType } from 'app/enums/certificate-key-type.enum';
import { ExtendedKeyUsageFlag } from 'app/enums/extended-key-usage-flag.enum';

export interface Certificate {
  id: number;
  type: number;
  name: string;
  certificate: string | null;
  privatekey: string | null;
  CSR: string | null;
  acme_uri: string | null;
  domains_authenticators: Record<string, unknown> | null;
  renew_days: number | null;
  acme: Record<string, unknown> | null;
  add_to_trusted_store: boolean;
  root_path: string;
  certificate_path: string | null;
  privatekey_path: string | null;
  csr_path: string | null;
  cert_type: string; // Enum? "CERTIFICATE"
  cert_type_existing: boolean;
  cert_type_CSR: boolean;
  chain_list: string[];
  key_length: number | null;
  key_type: CertificateKeyType | null;
  country: string | null;
  state: string | null;
  city: string | null;
  organization: string | null;
  organizational_unit: string | null;
  common: string | null;
  san: string[] | null;
  email: string | null;
  DN: string | null;
  subject_name_hash: number | null;
  extensions: Record<string, string>;
  digest_algorithm: string | null;
  lifetime: number | null;
  from: string | null;
  until: string | null;
  serial: number | null;
  chain: boolean | null;
  fingerprint: string | null;
  expired: boolean | null;
  parsed: boolean;
}

export type CertificateProfiles = Record<string, CertificateProfile>;

export interface BasicConstraints {
  ca: boolean;
  enabled: boolean;
  path_length: number | null;
  extension_critical: boolean;
}

export interface ExtendedKeyUsage {
  usages: ExtendedKeyUsageFlag[];
  enabled: boolean;
  extension_critical: boolean;
}

export interface KeyUsages {
  enabled: boolean;
  digital_signature: boolean;
  content_commitment: boolean;
  key_encipherment: boolean;
  data_encipherment: boolean;
  key_agreement: boolean;
  key_cert_sign: boolean;
  crl_sign: boolean;
  encipher_only: boolean;
  decipher_only: boolean;
  extension_critical: boolean;
}

export interface CertificateExtensions {
  BasicConstraints: BasicConstraints;
  ExtendedKeyUsage: ExtendedKeyUsage;
  KeyUsage: KeyUsages;
}

export interface CertificateProfile {
  cert_extensions: CertificateExtensions;
  digest_algorithm: CertificateDigestAlgorithm;
  key_length: number;
  key_type: CertificateKeyType;
  lifetime: number;
}

export type CertificateExtension = keyof CertificateExtensions;

export type ExtendedKeyUsageChoices = Record<string, string>;

export interface CertificateCreate {
  name: string;
  create_type: CertificateCreateType;
  add_to_trusted_store?: boolean;
  certificate?: string | null;
  privatekey?: string | null;
  CSR?: string | null;
  key_length?: number | null;
  key_type?: string;
  ec_curve?: string;
  passphrase?: string | null;
  city?: string | null;
  common?: string | null;
  country?: string | null;
  email?: string | null;
  organization?: string | null;
  organizational_unit?: string | null;
  state?: string | null;
  digest_algorithm?: string;
  san?: string[];
  cert_extensions?: CertificateExtensions;
  acme_directory_uri?: string | null;
  csr_id?: number | null;
  tos?: boolean | null;
  dns_mapping?: Record<string, unknown>;
  renew_days?: number;
}

export interface CertificateUpdate {
  renew_days?: number;
  add_to_trusted_store?: boolean;
  name?: string;
}
