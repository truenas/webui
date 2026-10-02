import { JobParams } from '@truenas/api-client';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { DirectoryServicesConfig } from './directoryservices-config.interface';

export interface DirectoryServicesUpdate extends Omit<DirectoryServicesConfig, 'id'> {
  force: boolean;
}

/**
 * Hands the form's payload to `directoryservices.update` unchanged.
 *
 * The generated input differs in two ways that are about types, not the wire: it spells the
 * discriminants as literals where the forms use the UI's enums, and it asks for `service_type`
 * inside `configuration` as well as at the top level. The form has only ever sent the top-level
 * one, and this keeps it that way rather than changing the request under a type migration.
 * Tracked as gap 18 in docs/devs/typed-api-client.md.
 */
export function toDirectoryServicesUpdateArgs(
  update: DirectoryServicesUpdate,
): JobParams<WebUiApiDirectory, 'directoryservices.update'>[0] {
  return update as JobParams<WebUiApiDirectory, 'directoryservices.update'>[0];
}
