import { DnsAuthenticatorType } from 'app/enums/dns-authenticator-type.enum';
import { Schema } from 'app/interfaces/schema.interface';

export interface AttributesSchema {
  type: DnsAuthenticatorType;
  schema: Schema;
}
