import { CallResponse } from '@truenas/api-client';
import { DirectoryServiceStatus, DirectoryServiceType } from 'app/enums/directory-services.enum';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';

export interface DirectoryServicesStatus {
  type: DirectoryServiceType | null;
  status: DirectoryServiceStatus | null;
  status_msg: string | null;
}

/**
 * Reads `directoryservices.status` into the UI's shape: the generated type spells `type` and
 * `status` as the wire literals, where every reader compares them with the UI's enums, and
 * leaves `status` and `status_msg` optional where the UI expects `null` for "none".
 */
export function toDirectoryServicesStatus(
  status: CallResponse<WebUiApiDirectory, 'directoryservices.status'>,
): DirectoryServicesStatus {
  return {
    type: status.type as DirectoryServiceType | null,
    status: (status.status ?? null) as DirectoryServiceStatus | null,
    status_msg: status.status_msg ?? null,
  };
}
