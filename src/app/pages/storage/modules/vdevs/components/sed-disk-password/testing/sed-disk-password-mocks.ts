import { mockProvider } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { MockTypedApiResponse, mockTypedCall, mockTypedQuery } from 'app/core/testing/utils/mock-typed-api.utils';
import { WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { EntitlementsService } from 'app/services/entitlements.service';

/**
 * Answers for `ix-sed-disk-password` in the specs of the dialogs that host it: a pool that is not
 * all-SED and no SED disks, so the section stays hidden and lets the dialog submit as before.
 * Pass `disks` to script the picked disk's SED state.
 */
export function mockSedDiskPasswordCalls(
  {
    allSed = false,
    disks = [],
    isGlobalPasswordSet = true,
  }: {
    allSed?: boolean;
    disks?: WebUiQueryEntity<'disk.query'>[];
    isGlobalPasswordSet?: boolean;
  } = {},
): MockTypedApiResponse[] {
  return [
    mockTypedCall('system.advanced.sed_global_password_is_set', isGlobalPasswordSet),
    mockTypedQuery('pool.query', [{ id: 4, all_sed: allSed } as WebUiQueryEntity<'pool.query'>]),
    mockTypedQuery('disk.query', disks),
  ];
}

export const sedEntitledProvider = mockProvider(EntitlementsService, {
  entitled$: jest.fn(() => of(true)),
});
