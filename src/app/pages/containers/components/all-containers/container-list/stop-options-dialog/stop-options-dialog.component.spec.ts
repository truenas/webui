import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnDialogHarness } from '@truenas/ui-components';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import {
  StopOptionsDialog, StopOptionsOperation,
} from 'app/pages/containers/components/all-containers/container-list/stop-options-dialog/stop-options-dialog.component';

describe('StopOptionsDialogComponent', () => {
  let spectator: Spectator<StopOptionsDialog>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: StopOptionsDialog,
    providers: [
      mockProvider(DialogRef),
    ],
  });

  function setupTest(operation: StopOptionsOperation): void {
    spectator = createComponent({
      providers: [
        {
          provide: DIALOG_DATA,
          useValue: operation,
        },
      ],
    });

    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  }

  it('shows labels and text related to stopping a container when operation is Stop', async () => {
    setupTest(StopOptionsOperation.Stop);
    const dialog = await loader.getHarness(TnDialogHarness);
    expect(await dialog.getTitle()).toBe('Stop Options');
    expect(await loader.getHarness(TnButtonHarness.with({ label: 'Stop' }))).toBeTruthy();
  });

  it('shows labels and text related to restarting a container when operation is Restart', async () => {
    setupTest(StopOptionsOperation.Restart);
    const dialog = await loader.getHarness(TnDialogHarness);
    expect(await dialog.getTitle()).toBe('Restart Options');
    expect(await loader.getHarness(TnButtonHarness.with({ label: 'Restart' }))).toBeTruthy();
  });

  it('closes the form with parameters when graceful stop is selected', async () => {
    setupTest(StopOptionsOperation.Stop);

    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Stop Method': 'Wait for graceful stop',
    });

    const stopButton = await loader.getHarness(TnButtonHarness.with({ label: 'Stop' }));
    await stopButton.click();

    expect(spectator.inject(DialogRef).close).toHaveBeenCalledWith({});
  });

  it('closes the form with parameters when force after timeout is selected', async () => {
    setupTest(StopOptionsOperation.Stop);

    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Stop Method': 'Wait for graceful stop, then force',
    });

    const stopButton = await loader.getHarness(TnButtonHarness.with({ label: 'Stop' }));
    await stopButton.click();

    expect(spectator.inject(DialogRef).close).toHaveBeenCalledWith({
      force_after_timeout: true,
    });
  });

  it('closes the form with parameters when force immediately is selected', async () => {
    setupTest(StopOptionsOperation.Stop);

    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Stop Method': 'Force stop immediately',
    });

    const stopButton = await loader.getHarness(TnButtonHarness.with({ label: 'Stop' }));
    await stopButton.click();

    expect(spectator.inject(DialogRef).close).toHaveBeenCalledWith({
      force: true,
    });
  });

  it('closes the form with false when Cancel button is pressed', async () => {
    setupTest(StopOptionsOperation.Stop);

    const cancelButton = await loader.getHarness(TnButtonHarness.with({ label: 'Cancel' }));
    await cancelButton.click();

    expect(spectator.inject(DialogRef).close).toHaveBeenCalledWith(false);
  });
});
