export interface AuthenticatedEvent {
  name: 'Authenticated';
  sender: unknown;
  // Auth status
  data: boolean;
}
