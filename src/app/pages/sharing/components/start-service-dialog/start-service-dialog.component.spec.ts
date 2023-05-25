import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { IxCheckboxHarness } from 'app/modules/ix-forms/components/ix-checkbox/ix-checkbox.harness';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import {
  StartServiceDialogComponent, StartServiceDialogResult,
} from 'app/pages/sharing/components/start-service-dialog/start-service-dialog.component';

describe('StartServiceDialogComponent', () => {
  let spectator: Spectator<StartServiceDialogComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: StartServiceDialogComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      {
        provide: MAT_DIALOG_DATA,
        useValue: 'SMB',
      },
      mockProvider(MatDialogRef),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows a dialog with Enable automatically checkbox.', async () => {
    expect(spectator.query('.description')).toHaveText(
      'SMB Service is not currently running. Start the service now?',
    );

    const enableAutomaticallyCheckbox = await loader.getHarness(
      IxCheckboxHarness.with({ label: 'Enable this service to start automatically.' }),
    );
    await enableAutomaticallyCheckbox.setValue(true);

    const enableButton = await loader.getHarness(MatButtonHarness.with({ text: 'Enable Service' }));
    await enableButton.click();

    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith({
      start: true,
      startAutomatically: true,
    } as StartServiceDialogResult);
  });

  it('returns false result when No is pressed', async () => {
    const noButton = await loader.getHarness(MatButtonHarness.with({ text: 'No' }));
    await noButton.click();

    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith({
      start: false,
      startAutomatically: false,
    });
  });
});
