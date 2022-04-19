import { MailSecurity } from 'app/enums/mail-security.enum';

export interface MailConfig {
  fromemail: string;
  fromname: string;
  id: number;
  oauth: GmailOauthConfig | Record<string, never>;
  outgoingserver: string;
  pass: string;
  port: number;
  security: MailSecurity;
  smtp: boolean;
  user: string;
}

export interface GmailOauthConfig {
  client_id: string;
  client_secret: string;
  refresh_token: string;
}

export interface MailConfigUpdate {
  // Smtp field is actually about smtp authentication.
  smtp?: boolean;
  fromemail: string;
  fromname: string;
  oauth: GmailOauthConfig;
  outgoingserver?: string;
  pass?: string;
  port?: number;
  security?: MailSecurity;
  user?: string;
}

export interface SendMailParams {
  subject: string;
  text?: string;
  html?: string;
  to?: string[];
  cc?: string[];
  interval?: number;
  channel?: string;
  timeout?: number;
  attachments?: boolean;
  queue?: boolean;
  extra_headers?: Record<string, unknown>;
}
