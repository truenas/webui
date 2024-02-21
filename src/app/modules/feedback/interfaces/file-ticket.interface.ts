import {
  TicketCategory, TicketCriticality, TicketEnvironment, TicketType,
} from 'app/enums/file-ticket.enum';

interface EnterpriseFields {
  name?: string;
  email?: string;
  cc?: string[];
  phone?: string;
  environment?: TicketEnvironment;
  criticality?: TicketCriticality;
  category?: TicketCategory;
}

export interface CreateNewTicket extends EnterpriseFields {
  attach_debug: boolean;
  body: string;
  title: string;
  type?: TicketType;
  token?: string;
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

export type SimilarIssuesParams = [
  query: string,
];

export interface SimilarIssue {
  id: number;
  url: string;
  img: string;
  key: string;
  keyHtml: string;
  summary: string;
  summaryText: string;
}
