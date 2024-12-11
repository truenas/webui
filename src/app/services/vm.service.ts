import { Inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  BehaviorSubject, filter, Observable, repeat, Subject, switchMap, take,
} from 'rxjs';
import { ApiErrorName } from 'app/enums/api.enum';
import { VmState } from 'app/enums/vm.enum';
import { extractApiError } from 'app/helpers/api.helper';
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
import { DialogService } from 'app/modules/dialog/dialog.service';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { StopVmDialogComponent, StopVmDialogData } from 'app/pages/vm/vm-list/stop-vm-dialog/stop-vm-dialog.component';
import { DownloadService } from 'app/services/download.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { ApiService } from 'app/services/websocket/api.service';

@Injectable({ providedIn: 'root' })
export class VmService {
  hasVirtualizationSupport$ = new BehaviorSubject<boolean>(true);
  refreshVmList$ = new Subject<void>();
  private checkMemory$ = new Subject<void>();

  private wsMethods = {
    start: 'vm.start',
    restart: 'vm.restart',
    poweroff: 'vm.poweroff',
  } as const;

  constructor(
    private api: ApiService,
    private loader: AppLoaderService,
    private dialogService: DialogService,
    private translate: TranslateService,
    private errorHandler: ErrorHandlerService,
    private download: DownloadService,
    private matDialog: MatDialog,
    @Inject(WINDOW) private window: Window,
  ) {
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

  doStart(vm: VirtualMachine, overcommit = false): void {
    if (overcommit) {
      this.doAction(vm, this.wsMethods.start, [vm.id, { overcommit: true }]);
    } else {
      this.doAction(vm, this.wsMethods.start);
    }
  }

  doStop(vm: VirtualMachine): void {
    this.matDialog.open<StopVmDialogComponent, unknown, StopVmDialogData>(StopVmDialogComponent, { data: vm })
      .afterClosed()
      .pipe(filter(Boolean), take(1))
      .subscribe((data) => {
        this.doStopJob(vm, data.forceAfterTimeout);
      });
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
        next: () => this.openDisplayWebUri(vm.id),
        error: (error: unknown) => this.errorHandler.showErrorModal(error),
      });
  }

  toggleVmStatus(vm: VirtualMachine): void {
    if (vm.status.state === VmState.Running) {
      this.doStop(vm);
    } else {
      this.doStart(vm);
    }
  }

  toggleVmAutostart(vm: VirtualMachine): void {
    this.api.call('vm.update', [vm.id, { autostart: !vm.autostart } as VirtualMachineUpdate])
      .pipe(this.loader.withLoader(), take(1))
      .subscribe({
        next: () => {
          this.checkMemory();
          this.refreshVmList$.next();
        },
        error: (error: unknown) => {
          this.refreshVmList$.next();
          this.errorHandler.showErrorModal(error);
        },
      });
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
          this.refreshVmList$.next();
        },
        error: (error: unknown) => {
          const apiError = extractApiError(error);
          if (method === this.wsMethods.start
            && apiError?.errname === ApiErrorName.NoMemory) {
            this.onMemoryError(vm);
            return;
          }
          this.refreshVmList$.next();
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
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.checkMemory();
        this.refreshVmList$.next();
        this.dialogService.info(
          this.translate.instant('Finished'),
          this.translate.instant(helptextVmList.stop_dialog.successMessage, { vmName: vm.name }),
          true,
        );
      });
  }

  private onMemoryError(vm: VirtualMachine): void {
    this.dialogService.confirm({
      title: helptextVmList.memory_dialog.title,
      message: helptextVmList.memory_dialog.message,
      confirmationCheckboxText: helptextVmList.memory_dialog.secondaryCheckboxMessage,
      buttonText: helptextVmList.memory_dialog.buttonMessage,
    })
      .pipe(filter(Boolean), take(1))
      .subscribe(() => {
        this.doStart(vm, true);
      });
  }
}
