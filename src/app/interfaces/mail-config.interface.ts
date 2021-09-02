import { MailSecurity } from 'app/enums/mail-security.enum';

export interface MailConfig {
  fromemail: string;
  fromname: string;
  id: number;
  oauth: unknown;
  outgoingserver: string;
  pass: string;
  port: number;
  security: MailSecurity;
  smtp: boolean;
  user: string;
}

export type MailConfigUpdate = Omit<MailConfig, 'id'>;

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
