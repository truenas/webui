import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import {
  TnButtonHarness, TnCheckboxHarness, TnInputHarness, TnSelectHarness,
} from '@truenas/ui-components';
import {
  RebootOrShutdownDialog,
} from 'app/modules/layout/topbar/reboot-or-shutdown-dialog/reboot-or-shutdown-dialog.component';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';

describe('RebootOrShutdownDialogComponent', () => {
  let spectator: Spectator<RebootOrShutdownDialog>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: RebootOrShutdownDialog,
    providers: [
      mockProvider(DialogRef),
      provideMockStore({
        selectors: [
          {
            selector: selectIsEnterprise,
            value: true,
          },
        ],
      }),
    ],
  });

  it('shows appropriate button for a shutdown', async () => {
    spectator = createComponent({
      providers: [
        {
          provide: DIALOG_DATA,
          useValue: true,
        },
      ],
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);

    const button = await loader.getHarness(TnButtonHarness.with({ label: 'Shut Down' }));
    expect(button).toBeTruthy();
  });

  it('shows appropriate buttons and title for a reboot', async () => {
    spectator = createComponent({
      providers: [
        {
          provide: DIALOG_DATA,
          useValue: false,
        },
      ],
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);

    const button = await loader.getHarness(TnButtonHarness.with({ label: 'Restart' }));
    expect(button).toBeTruthy();
  });

  describe('closing the dialog', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          {
            provide: DIALOG_DATA,
            useValue: true,
          },
        ],
      });

      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('closes dialog with shutdown reason when it is selected from the list', async () => {
      const select = await loader.getHarness(TnSelectHarness);
      await select.selectOption(/System Update/);

      const confirmCheckbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'Confirm' }));
      await confirmCheckbox.check();

      const shutdownButton = await loader.getHarness(TnButtonHarness.with({ label: 'Shut Down' }));
      await shutdownButton.click();

      expect(spectator.inject(DialogRef).close).toHaveBeenCalledWith('System Update');
    });

    it('allows user to enter custom reason', async () => {
      const select = await loader.getHarness(TnSelectHarness);
      await select.selectOption(/Custom Reason/);

      const customReasonInput = await loader.getHarness(TnInputHarness);
      await customReasonInput.setValue('House on fire');

      const confirmCheckbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'Confirm' }));
      await confirmCheckbox.check();

      const shutdownButton = await loader.getHarness(TnButtonHarness.with({ label: 'Shut Down' }));
      await shutdownButton.click();

      expect(spectator.inject(DialogRef).close).toHaveBeenCalledWith('House on fire');
    });
  });
});

describe('RebootOrShutdownDialog – non-enterprise', () => {
  let spectator: Spectator<RebootOrShutdownDialog>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: RebootOrShutdownDialog,
    providers: [
      mockProvider(DialogRef),
      provideMockStore({
        selectors: [
          {
            selector: selectIsEnterprise,
            value: false,
          },
        ],
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      providers: [
        {
          provide: DIALOG_DATA,
          useValue: true,
        },
      ],
    });

    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('does not show "Confirm is required" warning initially', async () => {
    const checkbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'Confirm' }));
    expect(await checkbox.getErrorText()).toBeFalsy();
  });

  it('shows "Confirm is required" warning only after checking and unchecking confirm', async () => {
    const checkbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'Confirm' }));
    await checkbox.check();
    expect(await checkbox.getErrorText()).toBeFalsy();

    await checkbox.uncheck();
    expect(await checkbox.getErrorText()).toBeTruthy();
  });

  it('should not render select/input and allow submission when only confirm is checked', async () => {
    expect(await loader.hasHarness(TnSelectHarness)).toBe(false);

    const checkbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'Confirm' }));
    await checkbox.check();

    const submit = await loader.getHarness(TnButtonHarness.with({ label: /Restart|Shut Down/ }));
    await submit.click();

    expect(spectator.inject(DialogRef).close).toHaveBeenCalledWith(expect.stringMatching(/Unspecified/i));
  });
});
