import { CACreateType } from '../enums/ca-create-type.enum';
import { CADigestAlgorithm } from '../enums/ca-digest-algorithm.enum';
import { CAKeyType } from '../enums/ca-key-type.enum';
import { EcCurve } from '../enums/ec-curve.enum';
import { ExtendedKeyUsages } from '../enums/extended-key-usages.enum';

export interface BasicConstraints {
  ca: boolean;
  enabled: boolean;
  path_length: number;
  extension_critical: boolean;
}

export interface AuthorityKeyIdentifier {
  authority_cert_issuer: boolean;
  enabled: boolean;
  extension_critical: boolean;
}

export interface ExtendedKeyUsage {
  usages: ExtendedKeyUsages;
  enabled: boolean;
  extension_critical: boolean;
}

export interface KeyUsage {
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
  AuthorityKeyIdentifier: AuthorityKeyIdentifier;
  ExtendedKeyUsage: ExtendedKeyUsage;
  KeyUsage: KeyUsage;
}

export interface CertificateAuthorityUpdate {
  tos: boolean;
  csr_id: number;
  signedby: number;
  key_length: number;
  renew_days: number;
  type: number;
  lifetime: number;
  serial: number;
  acme_directory_uri: string;
  certificate: string;
  city: string;
  common: string;
  country: string;
  CSR: string;
  ec_curve: EcCurve;
  email: string;
  key_type: CAKeyType;
  name: string;
  organization: string;
  organizational_unit: string;
  passphrase: string;
  privatekey: string;
  state: string;
  create_type: CACreateType;
  digest_algorithm: CADigestAlgorithm;
  san: string[];
  cert_extensions: CertificateExtensions;
}

export interface CertificateAuthorityCreate extends CertificateAuthorityUpdate {}
