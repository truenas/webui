import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment, UnitTestElement } from '@angular/cdk/testing/testbed';
import { Router } from '@angular/router';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import {
  TnBannerHarness, TnButtonHarness, TnDialog, TnTooltipHarness,
} from '@truenas/ui-components';
import { of } from 'rxjs';
import { fakeFile } from 'app/core/testing/utils/fake-file.uitls';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { VmState } from 'app/enums/vm.enum';
import { VirtualMachine } from 'app/interfaces/virtual-machine.interface';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { VmEditFormComponent } from 'app/pages/vm/vm-edit-form/vm-edit-form.component';
import { CloneVmDialogComponent } from 'app/pages/vm/vm-list/clone-vm-dialog/clone-vm-dialog.component';
import { DeleteVmDialogComponent } from 'app/pages/vm/vm-list/delete-vm-dialog/delete-vm-dialog.component';
import { VmService } from 'app/services/vm.service';
import { VirtualMachineDetailsRowComponent } from './vm-details-row.component';

const virtualMachine = {
  id: 2,
  display_available: true,
  status: {
    state: VmState.Running,
    pid: 12028,
    domain_state: 'RUNNING',
  },
} as VirtualMachine;

const stoppedVirtualMachine = {
  ...virtualMachine,
  status: {
    ...virtualMachine.status,
    state: VmState.Stopped,
  },
} as VirtualMachine;

const suspendedVirtualMachine = {
  ...virtualMachine,
  status: {
    ...virtualMachine.status,
    state: VmState.Suspended,
  },
} as VirtualMachine;

describe('VirtualMachineDetailsRowComponent', () => {
  let spectator: Spectator<VirtualMachineDetailsRowComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: VirtualMachineDetailsRowComponent,
    providers: [
      mockAuth(),
      mockProvider(VmService, {
        hasVirtualizationSupport$: of(true),
        downloadLogs: jest.fn(() => of(fakeFile('test.log'))),
        doStartResume: jest.fn(() => of()),
        doStop: jest.fn(() => of()),
        doRestart: jest.fn(() => of()),
        doPowerOff: jest.fn(() => of(true)),
        doSuspend: jest.fn(() => of(true)),
        doReset: jest.fn(() => of(true)),
        openDisplay: jest.fn(() => of()),
      }),
      mockProvider(FormSidePanelService, {
        open: jest.fn(() => SlideInResult.empty()),
      }),
      mockProvider(TnDialog, {
        open: jest.fn(() => ({
          closed: of(true),
        })),
      }),
      mockProvider(Router),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        vm: virtualMachine,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  /** Hovers the button with this label and returns the text of the tooltip it opens. */
  async function hoverForTooltip(label: RegExp): Promise<string> {
    const button = await loader.getHarness(TnButtonHarness.with({ label }));
    const host = await button.host();

    // tn-tooltip opens on a setTimeout, which whenStable() does not wait for.
    jest.useFakeTimers();
    try {
      let isHovered = false;
      const hovered = host.hover().finally(() => {
        isHovered = true;
      });
      while (!isHovered) {
        await jest.advanceTimersByTimeAsync(10);
      }
      await hovered;
      await jest.runOnlyPendingTimersAsync();
    } finally {
      jest.useRealTimers();
    }

    const tooltip = await TestbedHarnessEnvironment.documentRootLoader(spectator.fixture)
      .getHarness(TnTooltipHarness);
    return tooltip.getText();
  }

  // White-box: TnButtonHarness exposes no test-id getter yet, so the resolved data-test values
  // are read off the native buttons tn-button renders (library request pending — see the
  // NAS-141021 follow-ups). Order-insensitive on purpose: this guards ID preservation across
  // the migration, not the buttons' layout order.
  it('keeps per-vm test ids on the action buttons', () => {
    const testIds = Array.from(spectator.queryAll('tn-button button'))
      .map((el) => el.getAttribute('data-test'));

    expect(testIds).toEqual(expect.arrayContaining([
      'button-stop-2',
      'button-suspend-2',
      'button-restart-2',
      'button-reset-2',
      'button-power-off-2',
      'button-edit-2',
      'button-delete-2',
      'button-devices-2',
      'button-clone-2',
      'button-open-display-2',
      'button-open-serial-shell-2',
      'button-download-logs-2',
    ]));
  });

  it('should open edit form', async () => {
    const editButton = await loader.getHarness(TnButtonHarness.with({ label: /Edit/ }));
    await editButton.click();

    expect(spectator.inject(FormSidePanelService).open).toHaveBeenCalledWith(
      VmEditFormComponent,
      { title: 'Edit VM', inputs: { vmToEdit: virtualMachine } },
    );
  });

  it('should open clone dialog', async () => {
    const cloneButton = await loader.getHarness(TnButtonHarness.with({ label: /Clone/ }));
    await cloneButton.click();

    expect(spectator.inject(TnDialog).open).toHaveBeenCalledWith(
      CloneVmDialogComponent,
      { data: virtualMachine },
    );
  });

  it('should open delete dialog', async () => {
    const deleteButton = await loader.getHarness(TnButtonHarness.with({ label: /Delete/ }));
    await deleteButton.click();

    expect(spectator.inject(TnDialog).open).toHaveBeenCalledWith(
      DeleteVmDialogComponent,
      { data: virtualMachine },
    );
  });

  it('should redirect to devices page', async () => {
    const devicesButton = await loader.getHarness(TnButtonHarness.with({ label: /Devices/ }));
    await devicesButton.click();

    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/vm', '2', 'devices']);
  });

  it('should redirect to serial shell page', async () => {
    const serialButton = await loader.getHarness(TnButtonHarness.with({ label: /Serial Shell/ }));
    await serialButton.click();

    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/vm', '2', 'serial']);
  });

  it('should return log file when pressed the "Download Logs" button', async () => {
    const downloadLogsButton = await loader.getHarness(TnButtonHarness.with({ label: /Download Logs/ }));
    await downloadLogsButton.click();

    expect(spectator.inject(VmService).downloadLogs).toHaveBeenCalled();
  });

  it('should call service to start the VM', async () => {
    spectator.setInput('vm', stoppedVirtualMachine);

    const startButton = await loader.getHarness(TnButtonHarness.with({ label: /Start/ }));
    expect(await startButton.getIconName()).toBe('mdi-play-circle');

    await startButton.click();

    expect(spectator.inject(VmService).doStartResume).toHaveBeenCalledWith(stoppedVirtualMachine);
  });

  it('should call service to restart the VM', async () => {
    const restartButton = await loader.getHarness(TnButtonHarness.with({ label: /Restart/ }));
    await restartButton.click();

    expect(spectator.inject(VmService).doRestart).toHaveBeenCalledWith(virtualMachine);
  });

  it('should call service to stop the VM', async () => {
    const stopButton = await loader.getHarness(TnButtonHarness.with({ label: /Stop/ }));

    expect(await stopButton.getIconName()).toBe('mdi-stop-circle');

    await stopButton.click();

    expect(spectator.inject(VmService).doStop).toHaveBeenCalledWith(virtualMachine);
  });

  it('should call service to power off the VM', async () => {
    const powerOffButton = await loader.getHarness(TnButtonHarness.with({ label: /Power Off/ }));
    await powerOffButton.click();

    expect(spectator.inject(VmService).doPowerOff).toHaveBeenCalledWith(virtualMachine);
  });

  it('should call service to suspend the VM', async () => {
    const suspendButton = await loader.getHarness(TnButtonHarness.with({ label: /Suspend/ }));
    expect(await suspendButton.getIconName()).toBe('mdi-pause-circle');

    await suspendButton.click();

    expect(spectator.inject(VmService).doSuspend).toHaveBeenCalledWith(virtualMachine);
  });

  it('describes Stop as a graceful shutdown in its tooltip', async () => {
    expect(await hoverForTooltip(/^Stop$/)).toContain('Graceful shutdown');
  });

  it('describes Power Off as a forced power off that may lose data in its tooltip', async () => {
    const tooltip = await hoverForTooltip(/Power Off/);

    expect(tooltip).toContain('Forced power off');
    expect(tooltip).toContain('may result in data loss');
  });

  it('shows no suspended banner for a running VM', async () => {
    expect(await loader.hasHarness(TnBannerHarness)).toBe(false);
  });

  it('should call service to reset the VM', async () => {
    const resetButton = await loader.getHarness(TnButtonHarness.with({ label: /Reset/ }));
    expect(await resetButton.getIconName()).toBe('mdi-restart-alert');

    await resetButton.click();

    expect(spectator.inject(VmService).doReset).toHaveBeenCalledWith(virtualMachine);
  });

  it('spells out the hard reset in the accessible name of the Reset button', async () => {
    // tn-button renders `ariaLabel` onto the inner native button, which is what AT focuses,
    // so the assertion has to reach past the harness host — but it starts from the harness,
    // not from a test ID or a library class name.
    const resetButton = await loader.getHarness(TnButtonHarness.with({ label: /Reset/ }));
    const host = (await resetButton.host()) as UnitTestElement;
    const ariaLabel = host.element.querySelector('button')?.getAttribute('aria-label');

    expect(ariaLabel).toContain('hard reset');
    // The consequences belong in the tooltip and the confirmation dialog, not in the name.
    expect(ariaLabel).not.toContain('data loss');
  });

  it('should call service to open display', async () => {
    const openDisplayButton = await loader.getHarness(TnButtonHarness.with({ label: /Display/ }));
    await openDisplayButton.click();

    expect(spectator.inject(VmService).openDisplay).toHaveBeenCalledWith(virtualMachine);
  });

  describe('suspended VM', () => {
    beforeEach(() => {
      spectator.setInput('vm', suspendedVirtualMachine);
    });

    it('should show Resume button for suspended VM', async () => {
      const resumeButton = await loader.getHarness(TnButtonHarness.with({ label: /Resume/ }));
      expect(await resumeButton.getIconName()).toBe('mdi-play-circle');
      expect(resumeButton).toBeTruthy();
    });

    it('should show Power Off button for suspended VM', async () => {
      const powerOffButton = await loader.getHarness(TnButtonHarness.with({ label: /Power Off/ }));
      expect(powerOffButton).toBeTruthy();
    });

    it('should call service to resume suspended VM', async () => {
      const resumeButton = await loader.getHarness(TnButtonHarness.with({ label: /Resume/ }));
      await resumeButton.click();

      expect(spectator.inject(VmService).doStartResume).toHaveBeenCalledWith(suspendedVirtualMachine);
    });

    it('should not show Stop, Suspend, Restart or Reset buttons for suspended VM', async () => {
      const stopButtons = await loader.getAllHarnesses(TnButtonHarness.with({ label: /Stop/ }));
      const suspendButtons = await loader.getAllHarnesses(TnButtonHarness.with({ label: /Suspend/ }));
      const restartButtons = await loader.getAllHarnesses(TnButtonHarness.with({ label: /Restart/ }));
      const resetButtons = await loader.getAllHarnesses(TnButtonHarness.with({ label: /Reset/ }));

      expect(stopButtons).toHaveLength(0);
      expect(suspendButtons).toHaveLength(0);
      expect(restartButtons).toHaveLength(0);
      expect(resetButtons).toHaveLength(0);
    });

    it('says the VM is suspended, what that means, and that edits wait for a full stop and start', async () => {
      const banner = await loader.getHarness(TnBannerHarness);
      const text = await banner.getText();

      expect(text).toContain('This VM is suspended');
      expect(text).toContain('memory is still loaded');
      expect(text).toContain('not on Resume');
    });

    it('should not show Display button for suspended VM', async () => {
      const displayButtons = await loader.getAllHarnesses(TnButtonHarness.with({ label: /Display/ }));
      expect(displayButtons).toHaveLength(0);
    });

    it('should not show Serial Shell button for suspended VM', async () => {
      const serialButtons = await loader.getAllHarnesses(TnButtonHarness.with({ label: /Serial Shell/ }));
      expect(serialButtons).toHaveLength(0);
    });
  });
});
