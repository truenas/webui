import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { fakeFile } from 'app/core/testing/utils/fake-file.uitls';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { VmState } from 'app/enums/vm.enum';
import { VirtualMachine } from 'app/interfaces/virtual-machine.interface';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
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
        doStart: jest.fn(() => of()),
        doStop: jest.fn(() => of()),
        doRestart: jest.fn(() => of()),
        doPowerOff: jest.fn(() => of()),
        openDisplay: jest.fn(() => of()),
      }),
      mockProvider(SlideIn, {
        open: jest.fn(() => of()),
      }),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of(true),
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

  it('should open edit form', async () => {
    const editButton = await loader.getHarness(MatButtonHarness.with({ text: /Edit/ }));
    await editButton.click();

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(
      VmEditFormComponent,
      { data: virtualMachine },
    );
  });

  it('should open clone dialog', async () => {
    const cloneButton = await loader.getHarness(MatButtonHarness.with({ text: /Clone/ }));
    await cloneButton.click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(
      CloneVmDialogComponent,
      { data: virtualMachine },
    );
  });

  it('should open delete dialog', async () => {
    const deleteButton = await loader.getHarness(MatButtonHarness.with({ text: /Delete/ }));
    await deleteButton.click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(
      DeleteVmDialogComponent,
      { data: virtualMachine },
    );
  });

  it('should redirect to devices page', async () => {
    const devicesButton = await loader.getHarness(MatButtonHarness.with({ text: /Devices/ }));
    await devicesButton.click();

    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/vm', '2', 'devices']);
  });

  it('should redirect to serial shell page', async () => {
    const serialButton = await loader.getHarness(MatButtonHarness.with({ text: /Serial Shell/ }));
    await serialButton.click();

    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/vm', '2', 'serial']);
  });

  it('should return log file when pressed the "Download Logs" button', async () => {
    const downloadLogsButton = await loader.getHarness(MatButtonHarness.with({ text: /Download Logs/ }));
    await downloadLogsButton.click();

    expect(spectator.inject(VmService).downloadLogs).toHaveBeenCalled();
  });

  it('should call service to start the VM', async () => {
    spectator.setInput('vm', stoppedVirtualMachine);

    const startButton = await loader.getHarness(MatButtonHarness.with({ text: /Start/ }));
    const startIcon = await startButton.getHarness(IxIconHarness.with({ name: 'mdi-play-circle' }));
    expect(await startIcon.getName()).toBe('mdi-play-circle');

    await startButton.click();

    expect(spectator.inject(VmService).doStart).toHaveBeenCalledWith(stoppedVirtualMachine);
  });

  it('should call service to restart the VM', async () => {
    const restartButton = await loader.getHarness(MatButtonHarness.with({ text: /Restart/ }));
    await restartButton.click();

    expect(spectator.inject(VmService).doRestart).toHaveBeenCalledWith(virtualMachine);
  });

  it('should call service to stop the VM', async () => {
    const stopButton = await loader.getHarness(MatButtonHarness.with({ text: /Stop/ }));

    const stopIcon = await stopButton.getHarness(IxIconHarness.with({ name: 'mdi-stop-circle' }));
    expect(await stopIcon.getName()).toBe('mdi-stop-circle');

    await stopButton.click();

    expect(spectator.inject(VmService).doStop).toHaveBeenCalledWith(virtualMachine);
  });

  it('should call service to power off the VM', async () => {
    const powerOffButton = await loader.getHarness(MatButtonHarness.with({ text: /Power Off/ }));
    await powerOffButton.click();

    expect(spectator.inject(VmService).doPowerOff).toHaveBeenCalledWith(virtualMachine);
  });

  it('should call service to open display', async () => {
    const openDisplayButton = await loader.getHarness(MatButtonHarness.with({ text: /Display/ }));
    await openDisplayButton.click();

    expect(spectator.inject(VmService).openDisplay).toHaveBeenCalledWith(virtualMachine);
  });

  describe('suspended VM', () => {
    beforeEach(() => {
      spectator.setInput('vm', suspendedVirtualMachine);
    });

    it('should show Resume button for suspended VM', async () => {
      const resumeButton = await loader.getHarness(MatButtonHarness.with({ text: /Resume/ }));
      const resumeIcon = await resumeButton.getHarness(IxIconHarness.with({ name: 'mdi-play-circle' }));

      expect(await resumeIcon.getName()).toBe('mdi-play-circle');
      expect(resumeButton).toBeTruthy();
    });

    it('should show Power Off button for suspended VM', async () => {
      const powerOffButton = await loader.getHarness(MatButtonHarness.with({ text: /Power Off/ }));
      expect(powerOffButton).toBeTruthy();
    });

    it('should call service to resume suspended VM', async () => {
      const resumeButton = await loader.getHarness(MatButtonHarness.with({ text: /Resume/ }));
      await resumeButton.click();

      expect(spectator.inject(VmService).doStart).toHaveBeenCalledWith(suspendedVirtualMachine);
    });

    it('should not show Stop or Restart buttons for suspended VM', async () => {
      const stopButtons = await loader.getAllHarnesses(MatButtonHarness.with({ text: /Stop/ }));
      const restartButtons = await loader.getAllHarnesses(MatButtonHarness.with({ text: /Restart/ }));

      expect(stopButtons).toHaveLength(0);
      expect(restartButtons).toHaveLength(0);
    });

    it('should not show Display button for suspended VM', async () => {
      const displayButtons = await loader.getAllHarnesses(MatButtonHarness.with({ text: /Display/ }));
      expect(displayButtons).toHaveLength(0);
    });

    it('should not show Serial Shell button for suspended VM', async () => {
      const serialButtons = await loader.getAllHarnesses(MatButtonHarness.with({ text: /Serial Shell/ }));
      expect(serialButtons).toHaveLength(0);
    });
  });
});
