import { KeyValuePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
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
} from 'app/enums/virtualization.enum';
import { Option } from 'app/interfaces/option.interface';
import {
  AvailableUsb,
  VirtualizationDevice,
  VirtualizationGpu, VirtualizationPciDevice,
  VirtualizationTpm,
  VirtualizationUsb,
} from 'app/interfaces/virtualization.interface';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  PciPassthroughDialog,
} from 'app/pages/instances/components/common/pci-passthough-dialog/pci-passthrough-dialog.component';
import { VirtualizationDevicesStore } from 'app/pages/instances/stores/virtualization-devices.store';
import { VirtualizationInstancesStore } from 'app/pages/instances/stores/virtualization-instances.store';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-add-device-menu',
  templateUrl: './add-device-menu.component.html',
  styleUrls: ['./add-device-menu.component.scss'],
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
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private loader = inject(LoaderService);
  private snackbar = inject(SnackbarService);
  private translate = inject(TranslateService);
  private devicesStore = inject(VirtualizationDevicesStore);
  private instancesStore = inject(VirtualizationInstancesStore);
  private matDialog = inject(MatDialog);

  private readonly usbChoices = toSignal(this.api.call('virt.device.usb_choices'), { initialValue: {} });
  // TODO: Stop hardcoding params
  private readonly gpuChoices = toSignal(this.api.call('virt.device.gpu_choices', [VirtualizationGpuType.Physical]), { initialValue: {} });

  protected readonly isLoadingDevices = this.devicesStore.isLoading;

  protected readonly availableUsbDevices = computed(() => {
    const usbChoices = Object.values(this.usbChoices());
    const existingUsbDevices = this.devicesStore.devices()
      .filter((device) => device.dev_type === VirtualizationDeviceType.Usb);

    return usbChoices.filter((usb) => {
      return !existingUsbDevices.find((device) => device.product_id === usb.product_id);
    });
  });

  protected readonly availableGpuDevices = computed(() => {
    const gpuChoices = this.gpuChoices();
    const usedGpus = this.devicesStore.devices()
      .filter((device) => device.dev_type === VirtualizationDeviceType.Gpu);

    return pickBy(gpuChoices, (_, pci) => {
      return !usedGpus.find((usedGpu) => usedGpu.pci === pci);
    });
  });

  protected canAddTpm = computed(() => {
    return !this.devicesStore.devices().some((device) => device.dev_type === VirtualizationDeviceType.Tpm);
  });

  protected isInstanceStopped = computed(() => {
    return this.instancesStore.selectedInstance()?.status === VirtualizationStatus.Stopped;
  });

  protected readonly hasDevicesToAdd = computed(() => {
    return this.availableUsbDevices().length > 0
      || Object.keys(this.availableGpuDevices()).length > 0
      || this.canAddTpm();
  });

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
    const existingDevices = this.devicesStore.devices()
      .filter((device) => device.dev_type === VirtualizationDeviceType.Pci)
      .map((device) => device.address);

    this.matDialog
      .open(PciPassthroughDialog, {
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
    const instanceId = this.instancesStore.selectedInstance()?.id;
    if (!instanceId) {
      return;
    }

    this.api.call('virt.instance.device_add', [instanceId, payload])
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.withErrorHandler(),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('Device was added'));
        this.devicesStore.loadDevices();
      });
  }
}
