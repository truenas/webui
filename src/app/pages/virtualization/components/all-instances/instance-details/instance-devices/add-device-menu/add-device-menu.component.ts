import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { VirtualizationDeviceType, VirtualizationGpuType, VirtualizationType } from 'app/enums/virtualization.enum';
import {
  AvailableGpu,
  AvailableUsb,
  VirtualizationDevice,
  VirtualizationGpu,
  VirtualizationUsb,
} from 'app/interfaces/virtualization.interface';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { VirtualizationInstancesStore } from 'app/pages/virtualization/stores/virtualization-instances.store';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { ApiService } from 'app/services/websocket/api.service';

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
  ],
})
export class AddDeviceMenuComponent {
  private readonly usbChoices = toSignal(this.api.call('virt.device.usb_choices'), { initialValue: {} });
  // TODO: Stop hardcoding params
  private readonly gpuChoices = toSignal(this.api.call('virt.device.gpu_choices', [VirtualizationType.Container, VirtualizationGpuType.Physical]), { initialValue: {} });

  protected readonly isLoadingDevices = this.instanceStore.isLoadingDevices;

  protected readonly availableUsbDevices = computed(() => {
    const usbChoices = Object.values(this.usbChoices());
    const existingUsbDevices = this.instanceStore.selectedInstanceDevices()
      .filter((device) => device.dev_type === VirtualizationDeviceType.Usb);

    return usbChoices.filter((usb) => {
      return !existingUsbDevices.find((device) => device.product_id === usb.product_id);
    });
  });

  protected readonly availableGpuDevices = computed(() => {
    const gpuChoices = Object.values(this.gpuChoices());
    const existingGpuDevices = this.instanceStore.selectedInstanceDevices()
      .filter((device) => device.dev_type === VirtualizationDeviceType.Gpu);

    return gpuChoices.filter((gpu) => {
      // TODO: Condition is incorrect.
      return !existingGpuDevices.find((device) => device.description === gpu.description);
    });
  });

  protected readonly hasDevicesToAdd = computed(() => {
    return this.availableUsbDevices().length > 0 || this.availableGpuDevices().length > 0;
  });

  constructor(
    private instanceStore: VirtualizationInstancesStore,
    private api: ApiService,
    private errorHandler: ErrorHandlerService,
    private loader: AppLoaderService,
    private snackbar: SnackbarService,
    private translate: TranslateService,
  ) {}

  protected addUsb(usb: AvailableUsb): void {
    this.addDevice({
      dev_type: VirtualizationDeviceType.Usb,
      product_id: usb.product_id,
    } as VirtualizationUsb);
  }

  protected addGpu(gpu: AvailableGpu): void {
    this.addDevice({
      dev_type: VirtualizationDeviceType.Gpu,
      // TODO: Incorrect value.
      description: gpu.description,
    } as VirtualizationGpu);
  }

  private addDevice(payload: VirtualizationDevice): void {
    const instanceId = this.instanceStore.selectedInstance().id;
    this.api.call('virt.instance.device_add', [instanceId, payload])
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('Device was added'));
        this.instanceStore.loadDevices();
      });
  }
}
