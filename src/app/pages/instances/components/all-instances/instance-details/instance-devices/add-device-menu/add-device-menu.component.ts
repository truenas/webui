import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { ContainerDeviceType } from 'app/enums/container.enum';
import {
  AvailableUsb,
  ContainerUsbDevice,
} from 'app/interfaces/container.interface';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
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

  private readonly usbChoices = toSignal(this.api.call('container.device.usb_choices'), { initialValue: {} as Record<string, AvailableUsb> });

  protected readonly isLoadingDevices = this.devicesStore.isLoading;

  protected readonly availableUsbDevices = computed(() => {
    const usbChoices = Object.values(this.usbChoices()) as AvailableUsb[];
    const existingUsbDevices = this.devicesStore.devices()
      .filter((device) => device.dev_type === ContainerDeviceType.Usb);

    return usbChoices.filter((usb) => {
      return !existingUsbDevices.find((device) => device.product_id === usb.product_id);
    });
  });

  protected readonly hasDevicesToAdd = computed(() => {
    return this.availableUsbDevices().length > 0;
  });

  protected addUsb(usb: AvailableUsb): void {
    this.addDevice({
      dev_type: ContainerDeviceType.Usb,
      product_id: usb.product_id,
    } as ContainerUsbDevice);
  }

  private addDevice(payload: Partial<ContainerUsbDevice>): void {
    const instanceId = this.instancesStore.selectedInstance()?.id;
    if (!instanceId) {
      return;
    }

    this.api.call('container.device.create', [{
      container: instanceId,
      attributes: payload as ContainerUsbDevice,
    }])
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
