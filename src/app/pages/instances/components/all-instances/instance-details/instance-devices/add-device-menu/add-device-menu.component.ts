import { KeyValuePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { pickBy } from 'lodash-es';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import {
  VirtualizationDeviceType,
  VirtualizationGpuType,
  VirtualizationStatus,
  VirtualizationType,
} from 'app/enums/virtualization.enum';
import { Option } from 'app/interfaces/option.interface';
import {
  AvailableUsb,
  VirtualizationDevice,
  VirtualizationGpu, VirtualizationPciDevice,
  VirtualizationTpm,
  VirtualizationUsb,
} from 'app/interfaces/virtualization.interface';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  PciPassthroughDialogComponent,
} from 'app/pages/instances/components/common/pci-passthough-dialog/pci-passthrough-dialog.component';
import { VirtualizationDevicesStore } from 'app/pages/instances/stores/virtualization-devices.store';
import { ErrorHandlerService } from 'app/services/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-add-device-menu',
  templateUrl: './add-device-menu.component.html',
  styleUrls: ['./add-device-menu.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButton,
    MatMenu,
    MatMenuItem,
    TestDirective,
    TranslateModule,
    MatMenuTrigger,
    NgxSkeletonLoaderModule,
    KeyValuePipe,
    MatTooltip,
  ],
})
export class AddDeviceMenuComponent {
  private readonly usbChoices = toSignal(this.api.call('virt.device.usb_choices'), { initialValue: {} });
  // TODO: Stop hardcoding params
  private readonly gpuChoices = toSignal(this.api.call('virt.device.gpu_choices', [VirtualizationGpuType.Physical]), { initialValue: {} });

  protected readonly isLoadingDevices = this.deviceStore.isLoading;

  protected readonly availableUsbDevices = computed(() => {
    const usbChoices = Object.values(this.usbChoices());
    const existingUsbDevices = this.deviceStore.devices()
      .filter((device) => device.dev_type === VirtualizationDeviceType.Usb);

    return usbChoices.filter((usb) => {
      return !existingUsbDevices.find((device) => device.product_id === usb.product_id);
    });
  });

  protected readonly availableGpuDevices = computed(() => {
    const gpuChoices = this.gpuChoices();
    const usedGpus = this.deviceStore.devices()
      .filter((device) => device.dev_type === VirtualizationDeviceType.Gpu);

    return pickBy(gpuChoices, (_, pci) => {
      return !usedGpus.find((usedGpu) => usedGpu.pci === pci);
    });
  });

  protected canAddTpm = computed(() => {
    return !this.deviceStore.devices().some((device) => device.dev_type === VirtualizationDeviceType.Tpm);
  });

  protected isInstanceStopped = computed(() => {
    return this.deviceStore.selectedInstance().status === VirtualizationStatus.Stopped;
  });

  protected readonly hasDevicesToAdd = computed(() => {
    return this.availableUsbDevices().length > 0
      || Object.keys(this.availableGpuDevices()).length > 0
      || this.canAddTpm();
  });

  protected readonly isVm = computed(() => {
    return this.deviceStore.selectedInstance()?.type === VirtualizationType.Vm;
  });

  constructor(
    private api: ApiService,
    private errorHandler: ErrorHandlerService,
    private loader: AppLoaderService,
    private snackbar: SnackbarService,
    private translate: TranslateService,
    private deviceStore: VirtualizationDevicesStore,
    private matDialog: MatDialog,
  ) {}

  protected addUsb(usb: AvailableUsb): void {
    this.addDevice({
      dev_type: VirtualizationDeviceType.Usb,
      product_id: usb.product_id,
    } as VirtualizationUsb);
  }

  protected addGpu(gpuPci: string): void {
    this.addDevice({
      dev_type: VirtualizationDeviceType.Gpu,
      pci: gpuPci,
    } as VirtualizationGpu);
  }

  protected addTpm(): void {
    this.addDevice({
      dev_type: VirtualizationDeviceType.Tpm,
    } as VirtualizationTpm);
  }

  protected addPciPassthrough(): void {
    const existingDevices = this.deviceStore.devices()
      .filter((device) => device.dev_type === VirtualizationDeviceType.Pci)
      .map((device) => device.address);

    this.matDialog
      .open(PciPassthroughDialogComponent, {
        minWidth: '90vw',
        data: {
          existingDeviceAddresses: existingDevices,
        },
      })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((addedDevices: Option<string>[] | undefined) => {
        if (!addedDevices?.length) {
          return;
        }

        this.addDevice({
          dev_type: VirtualizationDeviceType.Pci,
          address: addedDevices[0].value,
        } as VirtualizationPciDevice);
      });
  }

  private addDevice(payload: VirtualizationDevice): void {
    const instanceId = this.deviceStore.selectedInstance()?.id;
    if (!instanceId) {
      return;
    }

    this.api.call('virt.instance.device_add', [instanceId, payload])
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('Device was added'));
        this.deviceStore.loadDevices();
      });
  }
}
