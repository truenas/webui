import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewChild,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import {
  forkJoin, Observable, of, switchMap,
} from 'rxjs';
import { catchError } from 'rxjs/operators';
import { GiB, MiB } from 'app/constants/bytes.constant';
import { VmDeviceType, VmNicType, VmOs } from 'app/enums/vm.enum';
import { VirtualMachine, VirtualMachineUpdate } from 'app/interfaces/virtual-machine.interface';
import { VmDevice, VmDeviceUpdate } from 'app/interfaces/vm-device.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { SummarySection } from 'app/modules/common/summary/summary.interface';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { VmGpuService } from 'app/pages/vm/utils/vm-gpu.service';
import { OsStepComponent } from 'app/pages/vm/vm-wizard/steps/1-os-step/os-step.component';
import {
  CpuAndMemoryStepComponent,
} from 'app/pages/vm/vm-wizard/steps/2-cpu-and-memory-step/cpu-and-memory-step.component';
import { DiskStepComponent, NewOrExistingDisk } from 'app/pages/vm/vm-wizard/steps/3-disk-step/disk-step.component';
import {
  NetworkInterfaceStepComponent,
} from 'app/pages/vm/vm-wizard/steps/4-network-interface-step/network-interface-step.component';
import {
  InstallationMediaStepComponent,
} from 'app/pages/vm/vm-wizard/steps/5-installation-media-step/installation-media-step.component';
import { GpuStepComponent } from 'app/pages/vm/vm-wizard/steps/6-gpu-step/gpu-step.component';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { GpuService } from 'app/services/gpu/gpu.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './vm-wizard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VmWizardComponent implements OnInit {
  @ViewChild(OsStepComponent, { static: true }) osStep: OsStepComponent;
  @ViewChild(CpuAndMemoryStepComponent, { static: true }) cpuAndMemoryStep: CpuAndMemoryStepComponent;
  @ViewChild(DiskStepComponent, { static: true }) diskStep: DiskStepComponent;
  @ViewChild(NetworkInterfaceStepComponent, { static: true }) networkInterfaceStep: NetworkInterfaceStepComponent;
  @ViewChild(InstallationMediaStepComponent, { static: true }) installationMediaStep: InstallationMediaStepComponent;
  @ViewChild(GpuStepComponent, { static: true }) gpuStep: GpuStepComponent;

  get osForm(): OsStepComponent['form']['value'] {
    return this.osStep.form.value;
  }

  get cpuAndMemoryForm(): CpuAndMemoryStepComponent['form']['value'] {
    return this.cpuAndMemoryStep.form.value;
  }

  get diskForm(): DiskStepComponent['form']['value'] {
    return this.diskStep.form.value;
  }

  get nicForm(): NetworkInterfaceStepComponent['form']['value'] {
    return this.networkInterfaceStep.form.value;
  }

  get mediaForm(): InstallationMediaStepComponent['form']['value'] {
    return this.installationMediaStep.form.value;
  }

  get gpuForm(): GpuStepComponent['form']['value'] {
    return this.gpuStep.form.value;
  }

  isLoading = false;
  summary: SummarySection[];

  constructor(
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
    private dialogService: DialogService,
    private slideInRef: IxSlideInRef<VmWizardComponent>,
    private ws: WebSocketService,
    private errorHandler: ErrorHandlerService,
    private gpuService: GpuService,
    private vmGpuService: VmGpuService,
    private snackbar: SnackbarService,
  ) {}

  ngOnInit(): void {
    this.setDefaultsFromOs();
  }

  updateSummary(): void {
    const steps = [
      this.osStep,
      this.cpuAndMemoryStep,
      this.diskStep,
      this.networkInterfaceStep,
      this.installationMediaStep,
      this.gpuStep,
    ];

    this.summary = steps.map((step) => step.getSummary());
  }

  onSubmit(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    this.createVm().pipe(
      switchMap((vm) => this.createDevices(vm)),
      untilDestroyed(this),
    )
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.slideInRef.close();
          this.snackbar.success(this.translate.instant('Virtual machine created'));
          this.cdr.markForCheck();
        },
        error: (error: WebsocketError) => {
          this.isLoading = false;
          this.dialogService.error(this.errorHandler.parseWsError(error));
          this.cdr.markForCheck();
        },
      });
  }

  private setDefaultsFromOs(): void {
    this.osStep.form.controls.os.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((os) => {
        if (os === VmOs.Windows) {
          this.cpuAndMemoryStep.form.patchValue({
            vcpus: 2,
            cores: 1,
            threads: 1,
            memory: 4 * GiB,
          });
          this.diskStep.form.patchValue({
            volsize: 40 * GiB,
          });
        } else {
          this.cpuAndMemoryStep.form.patchValue({
            vcpus: 1,
            cores: 1,
            threads: 1,
            memory: 512 * MiB,
          });
          this.diskStep.form.patchValue({
            volsize: 10 * GiB,
          });
        }
      });
  }

  private createVm(): Observable<VirtualMachine> {
    const vmPayload = {
      ..._.pick(this.osForm, [
        'name', 'description', 'time', 'hyperv_enlightenments', 'bootloader', 'shutdown_timeout', 'autostart',
      ]),
      ..._.pick(this.cpuAndMemoryForm, [
        'cpu_mode', 'vcpus', 'cores', 'threads', 'cpuset', 'nodeset', 'pin_vcpus',
      ]),
      cpu_model: this.cpuAndMemoryForm.cpu_model || null,
      // Middleware expects values in MiBs
      memory: this.cpuAndMemoryForm.memory / MiB,
      min_memory: this.cpuAndMemoryForm.min_memory ? this.cpuAndMemoryForm.min_memory / MiB : null,
      ..._.pick(this.gpuForm, [
        'ensure_display_device', 'hide_from_msr',
      ]),
    } as VirtualMachineUpdate;

    return this.ws.call('vm.create', [vmPayload]);
  }

  private createDevices(vm: VirtualMachine): Observable<unknown[]> {
    const requests: Observable<unknown>[] = [
      this.getNicRequest(vm),
      this.getDiskRequest(vm),
    ];

    if (this.mediaForm.iso_path) {
      requests.push(this.getCdromRequest(vm));
    }

    if (this.osForm.enable_display) {
      requests.push(this.getDisplayRequest(vm));
    }

    if (this.gpuForm.gpus.length) {
      requests.push(...this.getGpuRequests(vm));
    }

    return forkJoin(requests);
  }

  private getNicRequest(vm: VirtualMachine): Observable<VmDevice> {
    return this.makeDeviceRequest(vm.id, {
      dtype: VmDeviceType.Nic,
      attributes: {
        type: this.nicForm.nic_type,
        mac: this.nicForm.nic_mac,
        nic_attach: this.nicForm.nic_attach,
        trust_guest_rx_filters: this.nicForm.nic_type === VmNicType.Virtio
          ? this.nicForm.trust_guest_rx_filters
          : false,
      },
    });
  }

  private getDiskRequest(vm: VirtualMachine): Observable<VmDevice> {
    if (this.diskForm.newOrExisting === NewOrExistingDisk.New) {
      const hdd = this.diskForm.datastore + '/' + this.osForm.name.replace(/\s+/g, '-') + '-' + Math.random().toString(36).substring(7);
      return this.makeDeviceRequest(vm.id, {
        dtype: VmDeviceType.Disk,
        attributes: {
          create_zvol: true,
          type: this.diskForm.hdd_type,
          physical_sectorsize: null,
          logical_sectorsize: null,
          zvol_name: hdd,
          zvol_volsize: this.diskForm.volsize,
        },
      });
    }

    return this.makeDeviceRequest(vm.id, {
      dtype: VmDeviceType.Disk,
      attributes: {
        path: this.diskForm.hdd_path,
        type: this.diskForm.hdd_type,
        physical_sectorsize: null,
        logical_sectorsize: null,
      },
    });
  }

  private getCdromRequest(vm: VirtualMachine): Observable<VmDevice> {
    return this.makeDeviceRequest(vm.id, {
      dtype: VmDeviceType.Cdrom,
      attributes: {
        path: this.mediaForm.iso_path,
      },
    });
  }

  private getGpuRequests(vm: VirtualMachine): Observable<unknown>[] {
    const gpusIds = this.gpuForm.gpus as unknown as string[];

    return [
      this.vmGpuService.updateVmGpus(vm, gpusIds),
      this.gpuService.addIsolatedGpuPciIds(gpusIds),
    ];
  }

  private getDisplayRequest(vm: VirtualMachine): Observable<VmDevice> {
    return this.ws.call('vm.port_wizard').pipe(
      switchMap((port) => {
        return this.makeDeviceRequest(vm.id, {
          dtype: VmDeviceType.Display,
          attributes: {
            port: port.port,
            bind: this.osForm.bind,
            password: this.osForm.password,
            web: true,
            type: this.osForm.display_type,
          },
        });
      }),
    );
  }

  private makeDeviceRequest(vmId: number, payload: VmDeviceUpdate): Observable<VmDevice> {
    return this.ws.call('vm.device.create', [{
      vm: vmId,
      ...payload,
    }])
      .pipe(
        catchError((error: WebsocketError) => {
          this.dialogService.error({
            title: this.translate.instant('Error creating device'),
            message: error.reason,
            backtrace: error.trace.formatted,
          });
          return of(null);
        }),
      );
  }
}
