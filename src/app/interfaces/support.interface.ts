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

export type FetchSupportParams = [
  username: string,
  password: string,
];

export interface NewTicketResponse {
  ticket: number;
  url: string;
}
