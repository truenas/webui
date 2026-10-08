import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness } from '@truenas/ui-components';
import { of, throwError } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockTypedApi, mockTypedJob } from 'app/core/testing/utils/mock-typed-api.utils';
import { JobState } from 'app/enums/job-state.enum';
import { Pool } from 'app/interfaces/pool.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
import { SedLockedWarningComponent } from './sed-locked-warning.component';

describe('SedLockedWarningComponent', () => {
  let spectator: Spectator<SedLockedWarningComponent>;
  let loader: HarnessLoader;

  const pool = {
    id: 1,
    name: 'tank',
    status_code: 'SED_LOCKED_DISKS',
    all_sed: true,
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
      mockTypedApi([
        mockTypedJob('pool.reimport', { state: JobState.Success }),
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

    const viewDisksButton = await loader.getHarness(TnButtonHarness.with({ label: 'View Disks' }));
    await viewDisksButton.click();

    expect(router.navigate).toHaveBeenCalledWith(['/storage', 'disks']);
  });

  it('calls pool.reimport and emits importSuccess when Import Again succeeds', async () => {
    const importSuccessSpy = jest.spyOn(spectator.component.importSuccess, 'emit');

    const importButton = await loader.getHarness(TnButtonHarness.with({ label: 'Import Again' }));
    await importButton.click();

    expect(spectator.inject(TypedApiService).job).toHaveBeenCalledWith('pool.reimport', [pool.id]);
    expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
    expect(importSuccessSpy).toHaveBeenCalled();
  });

  it('does not emit importSuccess when import fails', async () => {
    const importSuccessSpy = jest.spyOn(spectator.component.importSuccess, 'emit');
    const dialogService = spectator.inject(DialogService);
    jest.spyOn(dialogService, 'jobDialog').mockReturnValue({
      afterClosed: () => throwError(() => new Error('Import failed')),
    } as unknown as ReturnType<DialogService['jobDialog']>);

    const importButton = await loader.getHarness(TnButtonHarness.with({ label: 'Import Again' }));
    await importButton.click();

    expect(importSuccessSpy).not.toHaveBeenCalled();
  });
});
