import { SpectatorService } from '@ngneat/spectator';
import { createServiceFactory, mockProvider } from '@ngneat/spectator/jest';
import { TranslateService } from '@ngx-translate/core';
import { TnDialog } from '@truenas/ui-components';
import { firstValueFrom, of, throwError } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockCall, mockJob, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { ApiErrorName, JsonRpcErrorCode } from 'app/enums/api.enum';
import { VmDisplayType, VmState } from 'app/enums/vm.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { ApiErrorDetails } from 'app/interfaces/api-error.interface';
import { VirtualMachine } from 'app/interfaces/virtual-machine.interface';
import { VmDisplayDevice } from 'app/interfaces/vm-device.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { StopVmDialogComponent } from 'app/pages/vm/vm-list/stop-vm-dialog/stop-vm-dialog.component';
import { DownloadService } from 'app/services/download.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { ApiCallError } from './errors/error.classes';
import { VmService } from './vm.service';

/**
 * helper function to create a mock VM object
 * @param state state to put the VM in
 * @param name name to give the VM - will affect the log download name
 * @returns a mock `VirtualMachine` object
 */
const mockVm = (state: VmState = VmState.Stopped, name = 'vm'): VirtualMachine => ({ id: 1, name, status: { state } } as VirtualMachine);

describe('VmService', () => {
  let spectator: SpectatorService<VmService>;
  const createService = createServiceFactory({
    service: VmService,
    providers: [
      mockApi([
        mockCall('core.download'),
        mockCall('vm.virtualization_details', { supported: true, error: null }),
        mockCall('vm.start'),
        mockCall('vm.resume'),
        mockCall('vm.poweroff'),
        mockCall('vm.reset'),
        mockCall('vm.get_available_memory', 4096),
        mockJob('vm.stop', fakeSuccessfulJob()),
        mockJob('vm.restart', fakeSuccessfulJob()),
        mockCall('vm.get_display_devices', []),
      ]),
      mockProvider(DialogService),
      mockProvider(TnDialog, {
        open: jest.fn(() => ({
          closed: of(true),
        })),
      }),
      mockProvider(LoaderService, {
        withLoader: () => <T>(source$: T) => source$,
      }),
      mockProvider(TranslateService, {
        instant: jest.fn((key: string, params?: Record<string, unknown>) => {
          return params ? key.replace(/{(\w+)}/g, (_, name: string) => String(params[name])) : key;
        }),
      }),
      mockProvider(ErrorHandlerService, {
        showErrorModal: jest.fn(),
        withErrorHandler: () => <T>(source$: T) => source$,
      }),
      mockProvider(DownloadService, {
        downloadUrl: jest.fn(),
      }),
      mockProvider(SnackbarService),
      {
        provide: WINDOW,
        useValue: {
          open: jest.fn(),
          location: {
            href: '',
            hostname: 'truenas.local',
          },
        },
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
    const vm = mockVm(VmState.Stopped);
    spectator.service.doStartResume(vm);
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('vm.start', [1]);
  });

  it('should call `vm.resume` when the VM is suspended', () => {
    const vm = mockVm(VmState.Suspended);
    spectator.service.doStartResume(vm);
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('vm.resume', [1]);
  });

  it('should not pass overcommit parameter when resuming suspended VM', () => {
    const vm = mockVm(VmState.Suspended);
    spectator.service.doStartResume(vm, true); // overcommit=true
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('vm.resume', [1]); // no overcommit param
  });

  it('should open dialog to stop vm', () => {
    spectator.service.doStop({ id: 1 } as VirtualMachine);
    expect(spectator.inject(TnDialog).open).toHaveBeenCalledWith(StopVmDialogComponent, { data: { id: 1 } });
  });

  it('should call websocket to restart vm', () => {
    const apiService = spectator.inject(ApiService);
    jest.spyOn(apiService, 'startJob').mockReturnValue(of(1));

    spectator.service.doRestart({ id: 1 } as VirtualMachine);
    expect(apiService.startJob).toHaveBeenCalledWith('vm.restart', [1]);
  });

  it('should call websocket to poweroff vm', () => {
    const vm = mockVm(VmState.Running);
    spectator.service.doPowerOff(vm);
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('vm.poweroff', [1]);
  });

  it('should call websocket to reset vm after confirmation', async () => {
    const vm = mockVm(VmState.Running);
    const dialogService = spectator.inject(DialogService);
    jest.spyOn(dialogService, 'confirm').mockReturnValue(of(true));

    const wasReset = await firstValueFrom(spectator.service.doReset(vm));

    expect(dialogService.confirm).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining('The guest OS is not shut down cleanly'),
    }));
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('vm.reset', [1]);
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('VM vm has been reset.');
    expect(wasReset).toBe(true);
  });

  it('should not reset vm when confirmation is declined', async () => {
    const vm = mockVm(VmState.Running);
    const dialogService = spectator.inject(DialogService);
    jest.spyOn(dialogService, 'confirm').mockReturnValue(of(false));

    const wasReset = await firstValueFrom(spectator.service.doReset(vm));

    expect(spectator.inject(ApiService).call).not.toHaveBeenCalledWith('vm.reset', [1]);
    expect(spectator.inject(SnackbarService).success).not.toHaveBeenCalled();
    expect(wasReset).toBe(false);
  });

  it('should show an error and not report success when resetting vm fails', async () => {
    const vm = mockVm(VmState.Running);
    const errorHandlerService = spectator.inject(ErrorHandlerService);
    jest.spyOn(spectator.inject(DialogService), 'confirm').mockReturnValue(of(true));
    jest.spyOn(spectator.inject(ApiService), 'call').mockReturnValueOnce(throwError(() => new ApiCallError({
      code: JsonRpcErrorCode.CallError,
      message: 'Failed to reset VM',
    })));

    const wasReset = await firstValueFrom(spectator.service.doReset(vm));

    expect(errorHandlerService.showErrorModal).toHaveBeenCalled();
    expect(spectator.inject(SnackbarService).success).not.toHaveBeenCalled();
    expect(wasReset).toBe(false);
  });

  it('should call websocket to download vm logs', () => {
    const vm = mockVm(VmState.Running, 'test');
    spectator.service.downloadLogs(vm);
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('core.download', ['vm.log_file_download', [1], '1_test.log']);
  });

  it('should open an error dialog when the VM fails to start', async () => {
    const vm = mockVm(VmState.Shutoff);
    const apiService = spectator.inject(ApiService);
    const errorHandlerService = spectator.inject(ErrorHandlerService);
    const callSpy = jest.spyOn(apiService, 'call');
    const mockImpl = callSpy.getMockImplementation();

    callSpy.mockImplementation((method) => {
      if (method === 'vm.start') {
        return throwError(() => new ApiCallError({ code: JsonRpcErrorCode.CallError, message: 'Failed to start VM' }));
      }

      return mockImpl(method);
    });

    await firstValueFrom(spectator.service.doStartResume(vm));
    expect(apiService.call).toHaveBeenCalledWith('vm.start', [1]);
    expect(errorHandlerService.showErrorModal).toHaveBeenCalled();
  });

  it('should overcommit memory when VM start fails', async () => {
    const vm = mockVm(VmState.Shutoff);
    const apiService = spectator.inject(ApiService);
    const dialogService = spectator.inject(DialogService);
    const callSpy = jest.spyOn(apiService, 'call');
    const confirmSpy = jest.spyOn(dialogService, 'confirm');
    const mockImpl = callSpy.getMockImplementation();

    callSpy.mockImplementationOnce((method) => {
      if (method === 'vm.start') {
        return throwError(() => new ApiCallError({
          code: JsonRpcErrorCode.CallError,
          message: 'Failed to start VM',
          data: {
            errname: ApiErrorName.NoMemory,
          } as ApiErrorDetails,
        }));
      }

      return mockImpl(method);
    });

    confirmSpy.mockImplementation(() => of({ confirmed: true, secondaryCheckbox: false }));

    await firstValueFrom(spectator.service.doStartResume(vm));
    expect(apiService.call).toHaveBeenLastCalledWith('vm.start', [1, { overcommit: true }]);
    expect(dialogService.confirm).toHaveBeenCalled();
  });

  describe('openDisplay', () => {
    function mockDisplayDevices(devices: VmDisplayDevice[]): void {
      const apiService = spectator.inject(ApiService);
      const callSpy = jest.spyOn(apiService, 'call');
      const mockImpl = callSpy.getMockImplementation();

      callSpy.mockImplementation((method, params) => {
        if (method === 'vm.get_display_devices') {
          return of(devices);
        }

        return mockImpl(method, params);
      });
    }

    it('shows the address of the UI host when a VNC device is bound to a wildcard address', () => {
      mockDisplayDevices([
        { attributes: { type: VmDisplayType.Vnc, bind: '0.0.0.0', port: 5902 } } as VmDisplayDevice,
      ]);

      spectator.service.openDisplay(mockVm(VmState.Running));

      expect(spectator.inject(DialogService).info).toHaveBeenCalledWith(
        'VNC Display Available',
        'Connect using a VNC client to: truenas.local:5902',
        true,
      );
    });

    it('keeps the address of a VNC device that is bound to a specific address', () => {
      mockDisplayDevices([
        { attributes: { type: VmDisplayType.Vnc, bind: '10.10.16.82', port: 5902 } } as VmDisplayDevice,
      ]);

      spectator.service.openDisplay(mockVm(VmState.Running));

      expect(spectator.inject(DialogService).info).toHaveBeenCalledWith(
        'VNC Display Available',
        'Connect using a VNC client to: 10.10.16.82:5902',
        true,
      );
    });

    it('shows the address of the UI host when a SPICE device without web access is bound to a wildcard address', () => {
      mockDisplayDevices([
        {
          attributes: {
            type: VmDisplayType.Spice, bind: '::', port: 5900, web: false,
          },
        } as VmDisplayDevice,
      ]);

      spectator.service.openDisplay(mockVm(VmState.Running));

      expect(spectator.inject(DialogService).info).toHaveBeenCalledWith(
        'SPICE Display Available',
        'Web access is disabled. Connect using a SPICE client to: truenas.local:5900',
        true,
      );
    });
  });
});
