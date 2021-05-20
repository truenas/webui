import { DnsAuthenticatorType } from 'app/enums/dns-authenticator-type.enum';
import { Schema } from 'app/interfaces/schema.interface';

export type DnsAuthenticator = CloudflareDnsAuthenticator | Route53DnsAuthenticator;

export interface CloudflareDnsAuthenticator {
  id: number;
  name: string;
  authenticator: DnsAuthenticatorType.Cloudflare;
  attributes: {
    // Either
    api_token?: string;

    // Or
    cloudflare_email?: string;
    api_key?: string;
  };
}

export interface Route53DnsAuthenticator {
  id: number;
  name: string;
  authenticator: DnsAuthenticatorType.Route53;
  attributes: {
    access_key_id: string;
    secret_access_key: string;
  };
}

export interface AuthenticatorSchema {
  key: DnsAuthenticatorType;
  schema: Schema[];
}

export type CreateDnsAuthenticator = Omit<DnsAuthenticator, 'id'>;
export type UpdateDnsAuthenticator = Omit<DnsAuthenticator, 'id' | 'authenticator'>;
