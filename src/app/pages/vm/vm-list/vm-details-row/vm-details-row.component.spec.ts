import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { Subject, of } from 'rxjs';
import { fakeFile } from 'app/core/testing/utils/fake-file.uitls';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { VmState } from 'app/enums/vm.enum';
import { VirtualMachine } from 'app/interfaces/virtual-machine.interface';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { VmEditFormComponent } from 'app/pages/vm/vm-edit-form/vm-edit-form.component';
import { CloneVmDialogComponent } from 'app/pages/vm/vm-list/clone-vm-dialog/clone-vm-dialog.component';
import { DeleteVmDialogComponent } from 'app/pages/vm/vm-list/delete-vm-dialog/delete-vm-dialog.component';
import { SlideInService } from 'app/services/slide-in.service';
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

describe('VirtualMachineDetailsRowComponent', () => {
  let spectator: Spectator<VirtualMachineDetailsRowComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: VirtualMachineDetailsRowComponent,
    providers: [
      mockAuth(),
      mockProvider(VmService, {
        refreshVmList$: new Subject(),
        hasVirtualizationSupport$: of(true),
        downloadLogs: jest.fn(() => of(fakeFile('test.log'))),
        doStart: jest.fn(),
        doStop: jest.fn(),
        doRestart: jest.fn(() => of()),
      }),
      mockProvider(SlideInService, {
        open: jest.fn(() => {
          return { slideInClosed$: of(true) };
        }),
        onClose$: of(),
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

    expect(spectator.inject(SlideInService).open).toHaveBeenCalledWith(
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
});
