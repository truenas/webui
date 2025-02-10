import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import {
  StopOptionsDialogComponent, StopOptionsOperation,
} from 'app/pages/instances/components/all-instances/instance-list/stop-options-dialog/stop-options-dialog.component';

describe('StopOptionsDialogComponent', () => {
  let spectator: Spectator<StopOptionsDialogComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: StopOptionsDialogComponent,
    providers: [
      mockProvider(MatDialogRef),
    ],
  });

  function setupTest(operation: StopOptionsOperation): void {
    spectator = createComponent({
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: operation,
        },
      ],
    });

    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  }

  it('shows labels and text related to stopping an instance when operation is Stop', async () => {
    setupTest(StopOptionsOperation.Stop);
    expect(spectator.query('h1')).toHaveText('Stop Options');
    expect(await loader.getHarness(MatButtonHarness.with({ text: 'Stop' }))).toBeTruthy();
  });

  it('shows labels and text related to restarting an instance when operation is Restart', async () => {
    setupTest(StopOptionsOperation.Restart);
    expect(spectator.query('h1')).toHaveText('Restart Options');
    expect(await loader.getHarness(MatButtonHarness.with({ text: 'Restart' }))).toBeTruthy();
  });

  it('closes the form with stop parameters when form is submitted', async () => {
    setupTest(StopOptionsOperation.Stop);

    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      Timeout: 'Wait for 5 minutes',
      Force: true,
    });

    const stopButton = await loader.getHarness(MatButtonHarness.with({ text: 'Stop' }));
    await stopButton.click();

    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith({
      timeout: 5 * 60,
      force: true,
    });
  });

  it('closes the form with false when Cancel button is pressed', async () => {
    setupTest(StopOptionsOperation.Stop);

    const cancelButton = await loader.getHarness(MatButtonHarness.with({ text: 'Cancel' }));
    await cancelButton.click();

    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith(false);
  });
});
