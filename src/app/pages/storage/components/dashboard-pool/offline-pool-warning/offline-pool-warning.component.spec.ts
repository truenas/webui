import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness } from '@truenas/ui-components';
import { of, throwError } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockApi, mockJob } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { JobState } from 'app/enums/job-state.enum';
import { PoolStatus } from 'app/enums/pool-status.enum';
import { Pool } from 'app/interfaces/pool.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { OfflinePoolWarningComponent } from './offline-pool-warning.component';

describe('OfflinePoolWarningComponent', () => {
  let spectator: Spectator<OfflinePoolWarningComponent>;
  let loader: HarnessLoader;

  const lockedPool = {
    id: 1,
    name: 'tank',
    status: PoolStatus.Offline,
    status_code: 'LOCKED_SED_DISKS',
    all_sed: true,
  } as Pool;

  const createComponent = createComponentFactory({
    component: OfflinePoolWarningComponent,
    providers: [
      mockAuth(),
      mockProvider(Router),
      mockProvider(DialogService, {
        jobDialog: jest.fn(() => ({
          afterClosed: () => of(fakeSuccessfulJob()),
        })),
      }),
      mockApi([
        mockJob('pool.reimport', { state: JobState.Success }),
      ]),
    ],
  });

  function setup(pool: Pool): void {
    spectator = createComponent({ props: { pool } });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  }

  describe('pool whose SED disks are locked', () => {
    beforeEach(() => setup(lockedPool));

    it('explains that the SED disks must be unlocked first', () => {
      expect(spectator.fixture.nativeElement.textContent).toContain('Pool Failed to Import - SED Disks Locked');
      expect(spectator.fixture.nativeElement.textContent).toContain('Self-Encrypting Drives (SED)');
    });

    it('navigates to disks page when View Disks button is clicked', async () => {
      const viewDisksButton = await loader.getHarness(TnButtonHarness.with({ label: 'View Disks' }));
      await viewDisksButton.click();

      expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/storage', 'disks']);
    });

    it('calls pool.reimport and emits importSuccess when Import Again succeeds', async () => {
      const importSuccessSpy = jest.spyOn(spectator.component.importSuccess, 'emit');

      const importButton = await loader.getHarness(TnButtonHarness.with({ label: 'Import Again' }));
      await importButton.click();

      expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('pool.reimport', [lockedPool.id]);
      expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
      expect(importSuccessSpy).toHaveBeenCalled();
    });

    it('does not emit importSuccess when import fails', async () => {
      const importSuccessSpy = jest.spyOn(spectator.component.importSuccess, 'emit');
      jest.spyOn(spectator.inject(DialogService), 'jobDialog').mockReturnValue({
        afterClosed: () => throwError(() => new Error('Import failed')),
      } as unknown as ReturnType<DialogService['jobDialog']>);

      const importButton = await loader.getHarness(TnButtonHarness.with({ label: 'Import Again' }));
      await importButton.click();

      expect(importSuccessSpy).not.toHaveBeenCalled();
    });
  });

  describe('pool that is offline with no locked disks', () => {
    // Middleware drops `LOCKED_SED_DISKS` once the disks are unlocked, which is when a re-import can work.
    const unlockedPool = { ...lockedPool, status_code: null } as Pool;

    beforeEach(() => setup(unlockedPool));

    it('explains that the pool is configured but not imported', () => {
      const text = spectator.fixture.nativeElement.textContent as string;
      expect(text).toContain('Pool Failed to Import');
      expect(text).not.toContain('SED Disks Locked');
      expect(text).toContain('This pool is configured on the system but is not imported.');
    });

    it('still offers Import Again, which calls pool.reimport', async () => {
      const importButton = await loader.getHarness(TnButtonHarness.with({ label: 'Import Again' }));
      await importButton.click();

      expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('pool.reimport', [unlockedPool.id]);
    });
  });
});
