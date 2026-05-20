import { AuditEvent, AuditService, WebshellType } from 'app/enums/audit.enum';
import { AuditVersions, BaseAuditEntry } from 'app/interfaces/audit/audit.interface';
import { CredentialType } from 'app/interfaces/credential-type.interface';

interface BaseMiddlewareAuditEntry extends BaseAuditEntry {
  service: AuditService.Middleware;
  service_data: AuditMiddlewareServiceData;
}

export interface MiddlewareAuthenticationEventData {
  credentials: AuditMiddlewareCredentials;
  error: unknown;
}

export interface MiddlewareMethodCallData {
  method: string;
  params: unknown;
  description: string;
  authenticated: boolean;
  authorized: boolean;
}

export interface MiddlewareAuthenticationEntry extends BaseMiddlewareAuditEntry {
  event: AuditEvent.Authentication | AuditEvent.Logout;
  event_data: MiddlewareAuthenticationEventData;
}

export interface MiddlewareMethodCallEntry extends BaseMiddlewareAuditEntry {
  event: AuditEvent.MethodCall;
  event_data: MiddlewareMethodCallData;
}

export interface MiddlewareRebootEntry extends BaseMiddlewareAuditEntry {
  event: AuditEvent.Reboot;
  event_data: {
    reason: string;
  };
}

export interface MiddlewareWebshellTarget {
  app_name?: string;
  container_id?: string;
  vm_name?: string;
}

export interface MiddlewareWebshellEventData {
  shell_type: WebshellType;
  target: MiddlewareWebshellTarget | null;
  username: string;
  error: unknown;
}

export interface MiddlewareWebshellEntry extends BaseMiddlewareAuditEntry {
  event: AuditEvent.WebshellAuthentication | AuditEvent.WebshellLogout;
  event_data: MiddlewareWebshellEventData;
}

export type MiddlewareAuditEntry
  = | MiddlewareMethodCallEntry
    | MiddlewareAuthenticationEntry
    | MiddlewareRebootEntry
    | MiddlewareWebshellEntry;

export interface AuditMiddlewareCredentials {
  credentials: CredentialType;
  credentials_data: Record<string, unknown>;
}

export interface AuditMiddlewareServiceData {
  vers: AuditVersions;
  origin: string;
  protocol: string;
  credentials: AuditMiddlewareCredentials;
}
