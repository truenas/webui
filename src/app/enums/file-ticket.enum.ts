import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export enum TicketType {
  Bug = 'BUG',
  Suggestion = 'FEATURE',
}

export const ticketTypeLabels = new Map<TicketType, string>([
  [TicketType.Bug, T('Bug')],
  [TicketType.Suggestion, T('Suggestion')],
]);

export enum TicketCategory {
  Bug = 'BUG',
  Hardware = 'HARDWARE',
  Install = 'INSTALL',
  Performance = 'PERFORMANCE',
}

export const ticketCategoryLabels = new Map<TicketCategory, string>([
  [TicketCategory.Bug, T('Bug')],
  [TicketCategory.Hardware, T('Hardware')],
  [TicketCategory.Install, T('Install')],
  [TicketCategory.Performance, T('Performance')],
]);

export enum TicketEnvironment {
  Production = 'production',
  Staging = 'staging',
  Testing = 'testing',
  Prototyping = 'prototyping',
  Initial = 'initial',
}

export const ticketEnvironmentLabels = new Map<TicketEnvironment, string>([
  [TicketEnvironment.Production, T('Production')],
  [TicketEnvironment.Staging, T('Staging')],
  [TicketEnvironment.Testing, T('Testing')],
  [TicketEnvironment.Prototyping, T('Prototyping')],
  [TicketEnvironment.Initial, T('Initial Deployment/Setup')],
]);

export enum TicketCriticality {
  Inquiry = 'inquiry',
  LossFunctionality = 'loss_functionality',
  TotalDown = 'total_down',
}

export const ticketCriticalityLabels = new Map<TicketCriticality, string>([
  [TicketCriticality.Inquiry, T('Inquiry')],
  [TicketCriticality.LossFunctionality, T('Loss of Functionality')],
  [TicketCriticality.TotalDown, T('Total Down')],
]);

export const ticketAcceptedFiles = 'image/png,image/jpeg,image/gif';
