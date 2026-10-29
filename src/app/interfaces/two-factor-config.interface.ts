import { CallParams, CallResponse, v28_0_0 } from '@truenas/api-client';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';

export type GlobalTwoFactorConfig = CallResponse<WebUiApiDirectory, 'auth.twofactor.config'>;

export type GlobalTwoFactorConfigUpdate = CallParams<WebUiApiDirectory, 'auth.twofactor.update'>[0];

export type UserTwoFactorConfig = v28_0_0.UserTwofactorConfigEntry;
