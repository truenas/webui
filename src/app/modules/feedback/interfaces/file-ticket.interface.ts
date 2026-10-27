import { CallResponse, JobParams, JobResult } from '@truenas/api-client';
import {
  TicketCategory, TicketCriticality, TicketEnvironment, TicketType,
} from 'app/enums/file-ticket.enum';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';

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

/**
 * Hands a ticket over to `support.new_ticket`. Middleware declares one model per ticket kind — a community ticket
 * with its OAuth `token` and `type`, an enterprise one with the contact fields — where the UI builds one loose object.
 */
export function toNewTicketArgs(ticket: CreateNewTicket): JobParams<WebUiApiDirectory, 'support.new_ticket'>[0] {
  return ticket as JobParams<WebUiApiDirectory, 'support.new_ticket'>[0];
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
  debug_attach_error: string | null;
}

/**
 * Reads `support.new_ticket`'s result. Middleware declares `ticket` and `url` nullable, but a job that succeeded has
 * created the ticket, and the attachments and the success dialog need both.
 */
export function toNewTicketResponse(
  response: JobResult<WebUiApiDirectory, 'support.new_ticket'>,
): NewTicketResponse {
  return response as NewTicketResponse;
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

export interface SimilarIssue {
  id: number;
  url: string;
  img: string;
  key: string;
  keyHtml: string;
  summary: string;
  summaryText: string;
}

/**
 * Reads `support.similar_issues`. Middleware declares only optional `url` and `summary` and leaves the rest open,
 * while the UI reads the Jira search fields it returns.
 */
export function toSimilarIssues(issues: CallResponse<WebUiApiDirectory, 'support.similar_issues'>): SimilarIssue[] {
  return issues as unknown as SimilarIssue[];
}
