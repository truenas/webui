import { CallParams, CallResponse } from '@truenas/api-client';
import { MailSecurity } from 'app/enums/mail-security.enum';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';

export interface MailConfig {
  fromemail: string;
  fromname: string;
  id: number;
  oauth: MailOauthConfig | Record<string, never>;
  outgoingserver: string;
  pass: string;
  port: number;
  security: MailSecurity;
  smtp: boolean;
  user: string;
}

export interface MailOauthConfig {
  client_id: string;
  client_secret: string;
  refresh_token: string;
  provider: MailSendMethod;
}

/**
 * Reads `mail.config`. Middleware spells `security` as a literal and types an unset `oauth` as `null`, where
 * the form has always been handed an empty object.
 */
export function toMailConfig(config: CallResponse<WebUiApiDirectory, 'mail.config'>): MailConfig {
  return config as unknown as MailConfig;
}

export type MailConfigUpdate = CallParams<WebUiApiDirectory, 'mail.update'>[0];

export enum MailSendMethod {
  Smtp = 'smtp',
  Gmail = 'gmail',
  Outlook = 'outlook',
}
