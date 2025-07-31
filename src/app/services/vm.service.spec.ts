import { MatDialog } from '@angular/material/dialog';
import { SpectatorService } from '@ngneat/spectator';
import { createServiceFactory, mockProvider } from '@ngneat/spectator/jest';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom, of } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockCall, mockJob, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { WINDOW } from 'app/helpers/window.helper';
import { VirtualMachine } from 'app/interfaces/virtual-machine.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { LoaderService } from 'app/modules/loader/loader.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { StopVmDialogComponent } from 'app/pages/vm/vm-list/stop-vm-dialog/stop-vm-dialog.component';
import { DownloadService } from 'app/services/download.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
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
      mockProvider(LoaderService, {
        withLoader: () => (source$: any) => source$,
      }),
      mockProvider(TranslateService, {
        instant: jest.fn((key: string) => key),
      }),
      mockProvider(ErrorHandlerService, {
        showErrorModal: jest.fn(),
        withErrorHandler: () => (source$: any) => source$,
      }),
      mockProvider(DownloadService, {
        downloadUrl: jest.fn(),
      }),
      {
        provide: WINDOW,
        useValue: window,
      },
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
    const apiService = spectator.inject(ApiService);
    jest.spyOn(apiService, 'startJob').mockReturnValue(of(1));
    
    spectator.service.doRestart({ id: 1 } as VirtualMachine);
    expect(apiService.startJob).toHaveBeenCalledWith('vm.restart', [1]);
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
