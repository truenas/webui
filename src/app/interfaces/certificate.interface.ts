import { CertificateDigestAlgorithm } from 'app/enums/ca-digest-algorithm.enum';
import { CertificateKeyType } from 'app/enums/ca-key-type.enum';
import { CertificateAuthority } from 'app/interfaces/certificate-authority.interface';

export interface Certificate {
  CA_type_existing: boolean;
  CA_type_intermediate: boolean;
  CA_type_internal: boolean;
  CSR: any;
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
  cert_extensions: {
    [extension: string]: any;
  };
  digest_algorithm: CertificateDigestAlgorithm;
  key_length: number;
  key_type: CertificateKeyType;
  lifetime: number;
}

export interface ExtendedKeyUsageChoices {
  [key: string]: string;
}
