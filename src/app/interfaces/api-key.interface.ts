import { CallParams, CallResponse } from '@truenas/api-client';
import { ApiTimestamp } from 'app/interfaces/api-date.interface';
import { WebUiApiDirectory, WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';

type D = WebUiApiDirectory;

export interface ApiKey {
  created_at: ApiTimestamp;
  expires_at: ApiTimestamp;
  id: number;
  key: string;
  keyhash: string;
  local: boolean;
  revoked: boolean;
  name: string;
  username: string;
  user_identifier: number;
}

export interface CreateApiKeyRequest {
  name: string;
  username: string;
  expires_at: ApiTimestamp | null;
}

export interface UpdateApiKeyBody {
  name?: string;
  reset?: boolean;
  expires_at?: ApiTimestamp | null;
}

/**
 * Reads an `api_key.query` row, or the key `api_key.create` / `update` return, into the UI's `ApiKey`. The
 * generated entry types the timestamps as strings where the wire carries `{ $date }` envelopes (gap 15); it
 * describes the same object. Only `api_key.create` returns `key`, once.
 */
export function toApiKey(
  entry: WebUiQueryEntity<'api_key.query'> | CallResponse<D, 'api_key.create'> | CallResponse<D, 'api_key.update'>,
): ApiKey {
  return entry as unknown as ApiKey;
}

/** What `api_key.create` takes, as middleware declares it. */
export type ApiKeyCreateArgs = CallParams<D, 'api_key.create'>[0];

/** What `api_key.update` takes as its changes, as middleware declares it. */
export type ApiKeyUpdateArgs = CallParams<D, 'api_key.update'>[1];

/**
 * Hands the form's payload to `api_key.create` unchanged. Middleware declares `expires_at` as a string; the wire
 * takes the `{ $date }` envelope the form sends, and `null` for a key that does not expire (gap 15).
 */
export function toApiKeyCreateArgs(payload: CreateApiKeyRequest): ApiKeyCreateArgs {
  return payload as unknown as ApiKeyCreateArgs;
}

/** {@link toApiKeyCreateArgs} for `api_key.update`. */
export function toApiKeyUpdateArgs(payload: UpdateApiKeyBody): ApiKeyUpdateArgs {
  return payload as unknown as ApiKeyUpdateArgs;
}
