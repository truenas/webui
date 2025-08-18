import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  BehaviorSubject, catchError, filter, Observable, of, repeat, Subject, switchMap, take,
} from 'rxjs';
import { ApiErrorName } from 'app/enums/api.enum';
import { VmDisplayType } from 'app/enums/vm.enum';
import { extractApiErrorDetails } from 'app/helpers/api.helper';
import { WINDOW } from 'app/helpers/window.helper';
import { helptextVmList } from 'app/helptext/vm/vm-list';
import { ApiCallParams } from 'app/interfaces/api/api-call-directory.interface';
import {
  VirtualizationDetails,
  VirtualMachine,
  VirtualMachineUpdate,
  VmDisplayWebUriParams,
  VmDisplayWebUriParamsOptions,
} from 'app/interfaces/virtual-machine.interface';
import { VmDisplayDevice } from 'app/interfaces/vm-device.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { LoaderService } from 'app/modules/loader/loader.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { StopVmDialogComponent, StopVmDialogData } from 'app/pages/vm/vm-list/stop-vm-dialog/stop-vm-dialog.component';
import { DownloadService } from 'app/services/download.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@UntilDestroy()
@Injectable({ providedIn: 'root' })
export class VmService {
  private api = inject(ApiService);
  private loader = inject(LoaderService);
  private dialogService = inject(DialogService);
  private translate = inject(TranslateService);
  private errorHandler = inject(ErrorHandlerService);
  private download = inject(DownloadService);
  private matDialog = inject(MatDialog);
  private window = inject<Window>(WINDOW);

  hasVirtualizationSupport$ = new BehaviorSubject<boolean>(true);
  private checkMemory$ = new Subject<void>();

  private wsMethods = {
    start: 'vm.start',
    restart: 'vm.restart',
    poweroff: 'vm.poweroff',
  } as const;

  constructor() {
    this.getVirtualizationDetails().pipe(take(1)).subscribe((details) => {
      this.hasVirtualizationSupport$.next(details.supported);
    });
  }

  getVirtualizationDetails(): Observable<VirtualizationDetails> {
    return this.api.call('vm.virtualization_details');
  }

  getAvailableMemory(): Observable<number> {
    return this.api.call('vm.get_available_memory').pipe(
      repeat({ delay: () => this.checkMemory$ }),
    );
  }

  checkMemory(): void {
    this.checkMemory$.next();
  }

  doStart(vm: VirtualMachine, overcommit = false): Observable<boolean> {
    const params = overcommit ? [vm.id, { overcommit: true }] : [vm.id];

    return this.api.call(this.wsMethods.start, params as ApiCallParams<typeof this.wsMethods.start>)
      .pipe(
        this.loader.withLoader(),
        take(1),
        switchMap(() => {
          this.checkMemory();
          return of(true);
        }),
        catchError((error: unknown) => {
          const apiError = extractApiErrorDetails(error);
          if (apiError?.errname === ApiErrorName.NoMemory) {
            this.onMemoryError(vm);
            return of(false);
          }
          this.errorHandler.showErrorModal(error);
          return of(false);
        }),
      );
  }

  doStop(vm: VirtualMachine): Observable<boolean> {
    return this.matDialog.open<StopVmDialogComponent, unknown, StopVmDialogData>(StopVmDialogComponent, { data: vm })
      .afterClosed()
      .pipe(
        take(1),
        switchMap((data) => {
          if (data) {
            this.doStopJob(vm, data.forceAfterTimeout);
            return of(true);
          }
          return of(false);
        }),
        catchError((error: unknown) => {
          this.errorHandler.showErrorModal(error);
          return of(false);
        }),
      );
  }

  doRestart(vm: VirtualMachine): Observable<number> {
    return this.api.startJob(this.wsMethods.restart, [vm.id]).pipe(this.loader.withLoader());
  }

  doPowerOff(vm: VirtualMachine): void {
    this.doAction(vm, this.wsMethods.poweroff, [vm.id]);
  }

  downloadLogs(vm: VirtualMachine): Observable<Blob> {
    const filename = `${vm.id}_${vm.name}.log`;
    return this.api.call('core.download', ['vm.log_file_download', [vm.id], filename]).pipe(
      switchMap(([, url]) => this.download.downloadUrl(url, filename, 'text/plain')),
    );
  }

  openDisplay(vm: VirtualMachine): void {
    this.api.call('vm.get_display_devices', [vm.id])
      .pipe(this.loader.withLoader(), take(1))
      .subscribe({
        next: (devices: VmDisplayDevice[]) => {
          const spiceDevice = devices.find((device) => device.attributes.type === VmDisplayType.Spice);
          const vncDevices = devices.filter((device) => device.attributes.type === VmDisplayType.Vnc);

          if (spiceDevice?.attributes.web) {
            this.openDisplayWebUri(vm.id);
          } else if (vncDevices.length > 0) {
            const vncConnections = vncDevices.map((device) => `${device.attributes.bind}:${device.attributes.port}`).join(', ');
            this.dialogService.info(
              this.translate.instant('VNC Display Available'),
              this.translate.instant('Connect using a VNC client to: {connections}', { connections: vncConnections }),
              true,
            );
          } else if (spiceDevice && !spiceDevice.attributes.web) {
            this.dialogService.info(
              this.translate.instant('SPICE Display Available'),
              this.translate.instant(
                'Web access is disabled. Connect using a SPICE client to: {connection}',
                { connection: `${spiceDevice.attributes.bind}:${spiceDevice.attributes.port}` },
              ),
              true,
            );
          } else {
            this.dialogService.warn(
              this.translate.instant('No Display Available'),
              this.translate.instant('No display devices are configured for this VM.'),
            );
          }
        },
        error: (error: unknown) => this.errorHandler.showErrorModal(error),
      });
  }

  toggleVmAutostart(vm: VirtualMachine): Observable<boolean> {
    return this.api.call('vm.update', [vm.id, { autostart: !vm.autostart } as VirtualMachineUpdate])
      .pipe(
        this.loader.withLoader(),
        take(1),
        switchMap(() => {
          this.checkMemory();
          return of(true);
        }),
        catchError((error: unknown) => {
          this.errorHandler.showErrorModal(error);
          return of(false);
        }),
      );
  }

  private doAction<T extends 'vm.start' | 'vm.update' | 'vm.poweroff'>(
    vm: VirtualMachine,
    method: T,
    params: ApiCallParams<T> = [vm.id],
  ): void {
    this.api.call(method, params)
      .pipe(this.loader.withLoader(), take(1))
      .subscribe({
        next: () => {
          this.checkMemory();
        },
        error: (error: unknown) => {
          const apiError = extractApiErrorDetails(error);
          if (method === this.wsMethods.start
            && apiError?.errname === ApiErrorName.NoMemory) {
            this.onMemoryError(vm);
            return;
          }
          this.errorHandler.showErrorModal(error);
        },
      });
  }

  private openDisplayWebUri(vmId: number): void {
    const displayOptions = {
      protocol: this.window.location.protocol.replace(':', '').toUpperCase(),
    } as VmDisplayWebUriParamsOptions;

    const requestParams: VmDisplayWebUriParams = [
      vmId,
      this.window.location.host,
      displayOptions,
    ];

    this.api.call('vm.get_display_web_uri', requestParams)
      .pipe(this.loader.withLoader(), take(1))
      .subscribe({
        next: (webUri) => {
          if (webUri.error) {
            this.dialogService.warn(this.translate.instant('Error'), webUri.error);
            return;
          }
          this.window.open(webUri.uri, '_blank');
        },
        error: (error: unknown) => {
          this.errorHandler.showErrorModal(error);
        },
      });
  }

  private doStopJob(vm: VirtualMachine, forceAfterTimeout: boolean): void {
    this.dialogService.jobDialog(
      this.api.job('vm.stop', [vm.id, {
        force: false,
        force_after_timeout: forceAfterTimeout,
      }]),
      {
        title: this.translate.instant('Stopping {rowName}', { rowName: vm.name }),
      },
    )
      .afterClosed()
      .pipe(
        this.errorHandler.withErrorHandler(),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.checkMemory();
        this.dialogService.info(
          this.translate.instant('Finished'),
          this.translate.instant(helptextVmList.stop_dialog.successMessage, { vmName: vm.name }),
          true,
        );
      });
  }

  private onMemoryError(vm: VirtualMachine): void {
    this.dialogService.confirm({
      title: this.translate.instant(helptextVmList.memory_dialog.title),
      message: this.translate.instant(helptextVmList.memory_dialog.message),
      confirmationCheckboxText: this.translate.instant(helptextVmList.memory_dialog.secondaryCheckboxMessage),
      buttonText: this.translate.instant(helptextVmList.memory_dialog.buttonMessage),
    })
      .pipe(
        filter(Boolean),
        take(1),
        switchMap(() => this.doStart(vm, true)),
      )
      .subscribe();
  }
}
