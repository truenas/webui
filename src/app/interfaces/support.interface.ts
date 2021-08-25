import { NewTicketType } from 'app/enums/new-ticket-type.enum';

export interface CreateNewTicket {
  attach_debug: boolean;
  body: string;
  category: string;
  password: string;
  title: string;
  type: NewTicketType;
  username: string;
}

export interface SupportConfig {
  id: number;
  enabled: boolean;
  name: string;
  title: string;
  email: string;
  phone: string;
  secondary_name: string;
  secondary_title: string;
  secondary_email: string;
  secondary_phone: string;
}

export type SupportConfigUpdate = Omit<SupportConfig, 'id'>;

export type FetchSupportParams = [
  username: string,
  password: string,
];

export interface NewTicketResponse {
  ticket: number;
  url: string;
}
