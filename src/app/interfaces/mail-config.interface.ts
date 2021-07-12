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
