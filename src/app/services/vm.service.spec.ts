import { MatDialog } from '@angular/material/dialog';
import { SpectatorService } from '@ngneat/spectator';
import { createServiceFactory, mockProvider } from '@ngneat/spectator/jest';
import { firstValueFrom, of } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockCall, mockJob, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { VirtualMachine } from 'app/interfaces/virtual-machine.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { StopVmDialogComponent } from 'app/pages/vm/vm-list/stop-vm-dialog/stop-vm-dialog.component';
import { ApiService } from 'app/services/websocket/api.service';
import { VmService } from './vm.service';

describe('VmService', () => {
  let spectator: SpectatorService<VmService>;
  const createService = createServiceFactory({
    service: VmService,
    providers: [
      mockApi([
        mockCall('core.download'),
        mockCall('vm.virtualization_details', { supported: true, error: null }),
        mockCall('vm.start'),
        mockCall('vm.poweroff'),
        mockCall('vm.get_available_memory', 4096),
        mockJob('vm.stop', fakeSuccessfulJob()),
        mockJob('vm.restart', fakeSuccessfulJob()),
      ]),
      mockProvider(DialogService),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of(true),
        })),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  it('should get virtualization details', async () => {
    expect(await firstValueFrom(spectator.service.hasVirtualizationSupport$)).toBe(true);
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('vm.virtualization_details');
  });

  it('should get available memory', async () => {
    expect(await firstValueFrom(spectator.service.getAvailableMemory())).toBe(4096);
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('vm.get_available_memory');
  });

  it('should call websocket to start vm', () => {
    spectator.service.doStart({ id: 1 } as VirtualMachine);
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('vm.start', [1]);
  });

  it('should open dialog to stop vm', () => {
    spectator.service.doStop({ id: 1 } as VirtualMachine);
    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(StopVmDialogComponent, { data: { id: 1 } });
  });

  it('should call websocket to restart vm', () => {
    spectator.service.doRestart({ id: 1 } as VirtualMachine);
    expect(spectator.inject(ApiService).startJob).toHaveBeenCalledWith('vm.restart', [1]);
  });

  it('should call websocket to poweroff vm', () => {
    spectator.service.doPowerOff({ id: 1 } as VirtualMachine);
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('vm.poweroff', [1]);
  });

  it('should call websocket to download vm logs', () => {
    spectator.service.downloadLogs({ id: 1, name: 'test' } as VirtualMachine);
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('core.download', ['vm.log_file_download', [1], '1_test.log']);
  });
});
