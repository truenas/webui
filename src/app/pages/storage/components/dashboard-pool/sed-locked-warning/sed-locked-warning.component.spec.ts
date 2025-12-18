import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockJob, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { Pool } from 'app/interfaces/pool.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { SedLockedWarningComponent } from './sed-locked-warning.component';

describe('SedLockedWarningComponent', () => {
  let spectator: Spectator<SedLockedWarningComponent>;
  let loader: HarnessLoader;

  const pool = {
    id: 1,
    name: 'tank',
  } as Pool;

  const createComponent = createComponentFactory({
    component: SedLockedWarningComponent,
    providers: [
      mockProvider(Router),
      mockProvider(DialogService, {
        jobDialog: jest.fn(() => ({
          afterClosed: () => of(fakeSuccessfulJob()),
        })),
      }),
      mockApi([
        mockJob('pool.reimport', fakeSuccessfulJob()),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: { pool },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('displays warning message about SED locked disks', () => {
    expect(spectator.fixture.nativeElement.textContent).toContain('Pool Failed to Import - SED Disks Locked');
    expect(spectator.fixture.nativeElement.textContent).toContain('Self-Encrypting Drives (SED)');
  });

  it('navigates to disks page when View Disks button is clicked', async () => {
    const router = spectator.inject(Router);

    const viewDisksButton = await loader.getHarness(MatButtonHarness.with({ text: 'View Disks' }));
    await viewDisksButton.click();

    expect(router.navigate).toHaveBeenCalledWith(['/storage', 'disks']);
  });

  it('calls pool.reimport via job dialog when Import Again button is clicked', async () => {
    const importButton = await loader.getHarness(MatButtonHarness.with({ text: 'Import Again' }));
    await importButton.click();

    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('pool.reimport', [pool.id]);
    expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
  });
});
