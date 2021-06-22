import { CertificateAuthority } from 'app/interfaces/certificate-authority.interface';

export interface Certificate {
  CA_type_existing: boolean;
  CA_type_intermediate: boolean;
  CA_type_internal: boolean;
  CSR: any;
  DN: string;
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
  issuer: string;
  key_length: number;
  key_type: string; // Enum RSA
  lifetime: number;
  name: string;
  organization: string;
  organizational_unit: any;
  parsed: boolean;
  privatekey: string;
  privatekey_path: string;
  revoked: boolean;
  revoked_date: any;
  root_path: string;
  san: string[];
  serial: number;
  signedby: CertificateAuthority;
  state: string;
  subject_name_hash: number;
  type: number;
  until: string;
}
