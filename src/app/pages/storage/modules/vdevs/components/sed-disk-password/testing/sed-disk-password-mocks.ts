import { mockProvider } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { MockApiCallResponse } from 'app/core/testing/interfaces/mock-api-responses.interface';
import { mockCall } from 'app/core/testing/utils/mock-api.utils';
import { Disk } from 'app/interfaces/disk.interface';
import { Pool } from 'app/interfaces/pool.interface';
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
    disks?: Disk[];
    isGlobalPasswordSet?: boolean;
  } = {},
): MockApiCallResponse[] {
  return [
    mockCall('system.advanced.sed_global_password_is_set', isGlobalPasswordSet),
    mockCall('pool.query', [{ id: 4, all_sed: allSed } as Pool]),
    mockCall('disk.query', disks),
  ];
}

export const sedEntitledProvider = mockProvider(EntitlementsService, {
  entitled$: jest.fn(() => of(true)),
});
