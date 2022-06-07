import {
  TicketCategory, TicketCriticality, TicketEnvironment, TicketType,
} from 'app/enums/file-ticket.enum';

export interface CreateNewTicket {
  attach_debug: boolean;
  body: string;
  category: TicketCategory;
  title: string;
  type?: TicketType;
  token?: string;
  name?: string;
  email?: string;
  cc?: string[];
  phone?: string;
  environment?: TicketEnvironment;
  criticality?: TicketCriticality;
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
  token: string,
];

export interface NewTicketResponse {
  ticket: number;
  url: string;
  has_debug: boolean;
}

export type OauthJiraMessage = MessageEvent<{
  error?: string;
  result?: string;
  data?: string;
}>;

export type AttachTicketParams = [
  token: string,
  filename: string,
  ticket: number,
];
