import { CallParams, CallResponse } from '@truenas/api-client';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';

export type GlobalTwoFactorConfig = CallResponse<WebUiApiDirectory, 'auth.twofactor.config'>;

export type GlobalTwoFactorConfigUpdate = CallParams<WebUiApiDirectory, 'auth.twofactor.update'>[0];

export interface UserTwoFactorConfig {
  /** Null until a secret exists for the account. */
  provisioning_uri: string | null;
  secret_configured: boolean;
  interval: number;
  otp_digits: number;
}
