import { DnsAuthenticatorType } from 'app/enums/dns-authenticator-type.enum';
import { Schema } from 'app/interfaces/schema.interface';

export interface DnsAuthenticator {
  id: number;
  name: string;
  attributes: Record<string, string>;
}

export interface AuthenticatorSchema {
  key: DnsAuthenticatorType;
  schema: Schema;
}

export type CreateDnsAuthenticator = Omit<DnsAuthenticator, 'id'>;
export type UpdateDnsAuthenticator = Omit<DnsAuthenticator, 'id'>;
