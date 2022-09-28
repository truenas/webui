import { CertificateDigestAlgorithm } from 'app/enums/ca-digest-algorithm.enum';
import { CertificateKeyType } from 'app/enums/ca-key-type.enum';
import { CertificateCreateType } from 'app/enums/certificate-create-type.enum';
import {
  AuthorityKeyIdentifier,
  BasicConstraints,
  CertificateAuthority,
  CertificateExtensions,
  ExtendedKeyUsage,
  KeyUsage,
} from 'app/interfaces/certificate-authority.interface';

export interface Certificate {
  CA_type_existing: boolean;
  CA_type_intermediate: boolean;
  CA_type_internal: boolean;
  CSR: string;
  DN: string;
  can_be_revoked: boolean;
  cert_type: string; // Enum? "CERTIFICATE"
  cert_type_CSR: boolean;
  cert_type_existing: boolean;
  cert_type_internal: boolean;
  certificate: string;
  certificate_path: string;
  chain: boolean;
  chain_list: string[];
  city: string;
  common: string;
  country: string;
  csr_path: string;
  digest_algorithm: string;
  email: string;
  extensions: { [extension: string]: string };
  fingerprint: string;
  from: string;
  id: number;
  internal: string;
  issuer: string | { name: string };
  key_length: number;
  key_type: string; // Enum RSA
  lifetime: number;
  name: string;
  organization: string;
  organizational_unit: string;
  parsed: boolean;
  privatekey: string;
  privatekey_path: string;
  revoked: boolean;
  revoked_date: string;
  root_path: string;
  san: string[];
  serial: number;
  signedby: CertificateAuthority;
  state: string;
  subject_name_hash: number;
  type: number;
  until: string;
}

export interface CertificateProfiles {
  [name: string]: CertificateProfile;
}

export interface CertificateProfile {
  cert_extensions: CertificateExtensions;
  digest_algorithm: CertificateDigestAlgorithm;
  key_length: number;
  key_type: CertificateKeyType;
  lifetime: number;
}

/**
 * Temporary type for type-safety reasons.
 * @deprecated
 */
export type CertificateExtension =
  Partial<
  & BasicConstraints
  & AuthorityKeyIdentifier
  & ExtendedKeyUsage
  & KeyUsage
  >;

/**
 * @deprecated
 */
export type CertificationExtensionAttribute =
  | keyof BasicConstraints
  | keyof AuthorityKeyIdentifier
  | keyof ExtendedKeyUsage
  | keyof KeyUsage;

export interface ExtendedKeyUsageChoices {
  [key: string]: string;
}

export interface CertificateCreate {
  tos?: boolean;
  dns_mapping?: Record<string, unknown>;
  csr_id?: number;
  signedby?: number;
  key_length?: number;
  renew_days?: number;
  type?: number;
  lifetime?: number;
  serial?: number;
  acme_directory_uri?: string;
  certificate?: string;
  city?: string;
  common?: string;
  country?: string;
  CSR?: string;
  ec_curve?: string;
  email?: string;
  key_type?: string;
  name: string;
  organization?: string;
  organizational_unit?: string;
  passphrase?: string;
  privatekey?: string;
  state?: string;
  create_type: CertificateCreateType;
  digest_algorithm?: string;
  san?: string;
  cert_extensions?: CertificateExtensions;
}

export interface CertificateUpdate {
  revoked?: boolean;
  name?: string;
}
