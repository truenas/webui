import { CallParams, CallResponse } from '@truenas/api-client';
import { DnsAuthenticatorType } from 'app/enums/dns-authenticator-type.enum';
import { Schema } from 'app/interfaces/schema.interface';
import { WebUiApiDirectory, WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';

type D = WebUiApiDirectory;

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

/** What `acme.dns.authenticator.create` takes, as middleware declares it. */
export type DnsAuthenticatorCreateArgs = CallParams<D, 'acme.dns.authenticator.create'>[0];

/**
 * Reads an `acme.dns.authenticator.query` row into the shape the list and form are written against.
 * The generated entry types `attributes` as a union of one schema per provider, discriminated on
 * `authenticator`; the form edits them as one flat record of strings, which is the same object.
 */
export function toDnsAuthenticator(entry: WebUiQueryEntity<'acme.dns.authenticator.query'>): DnsAuthenticator {
  return entry as unknown as DnsAuthenticator;
}

/**
 * Reads `acme.dns.authenticator.authenticator_schemas` into the UI's `Schema`. Middleware declares each
 * schema as a bare `{ _name_, title, _required_ }`, where the wire carries the whole JSON schema the form
 * builds its dynamic fields from (`properties`, `required`).
 */
export function toAuthenticatorSchemas(
  schemas: CallResponse<D, 'acme.dns.authenticator.authenticator_schemas'>,
): AuthenticatorSchema[] {
  return schemas as unknown as AuthenticatorSchema[];
}

/**
 * Hands the form's payload to `acme.dns.authenticator.create` and `update` unchanged. The form builds
 * `attributes` from the selected provider's schema and sets its `authenticator`, so it is one member of the
 * generated union typed loosely.
 */
export function toDnsAuthenticatorCreateArgs(payload: CreateDnsAuthenticator): DnsAuthenticatorCreateArgs {
  return payload as unknown as DnsAuthenticatorCreateArgs;
}
