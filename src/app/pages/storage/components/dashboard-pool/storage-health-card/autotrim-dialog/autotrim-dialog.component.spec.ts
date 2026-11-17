import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnCheckboxHarness } from '@truenas/ui-components';
import {
  catchError, EMPTY, Observable, throwError,
} from 'rxjs';
import { mockApi, mockJob } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { JobState } from 'app/enums/job-state.enum';
import { OnOff } from 'app/enums/on-off.enum';
import { Pool } from 'app/interfaces/pool.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  AutotrimDialog,
} from 'app/pages/storage/components/dashboard-pool/storage-health-card/autotrim-dialog/autotrim-dialog.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

describe('AutotrimDialogComponent', () => {
  let spectator: Spectator<AutotrimDialog>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: AutotrimDialog,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockAuth(),
      {
        provide: DIALOG_DATA,
        useValue: {
          id: 47,
          autotrim: {
            value: 'on',
          },
        } as Pool,
      },
      mockApi([
        mockJob('pool.update', { state: JobState.Success }),
      ]),
      mockProvider(SnackbarService),
      mockProvider(DialogService),
      mockProvider(DialogRef),
      mockProvider(ErrorHandlerService, {
        withErrorHandler: <T>() => (source$: Observable<T>) => source$.pipe(catchError((error: unknown) => {
          spectator.inject(ErrorHandlerService).showErrorModal(error);
          return EMPTY;
        })),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows current Auto TRIM setting', async () => {
    const autotrim = await loader.getHarness(TnCheckboxHarness);
    expect(await autotrim.isChecked()).toBe(true);
  });

  it('saves updated Auto TRIM setting when form is submitted', async () => {
    const autotrim = await loader.getHarness(TnCheckboxHarness);
    await autotrim.uncheck();

    const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('pool.update', [47, { autotrim: OnOff.Off }]);
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
    expect(spectator.inject(DialogRef).close).toHaveBeenCalledWith(true);
  });

  it('shows the error, no success message and keeps the dialog open when saving fails', async () => {
    jest.spyOn(spectator.inject(ApiService), 'job').mockReturnValue(throwError(() => new Error('Refused')));

    const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(ErrorHandlerService).showErrorModal).toHaveBeenCalledWith(new Error('Refused'));
    expect(spectator.inject(SnackbarService).success).not.toHaveBeenCalled();
    expect(spectator.inject(DialogRef).close).not.toHaveBeenCalled();
  });
});
