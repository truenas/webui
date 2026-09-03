import { ChangeDetectionStrategy, Component, computed, inject, DestroyRef } from '@angular/core';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { catchError, of } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { ContainerDeviceType } from 'app/enums/container.enum';
import { Role } from 'app/enums/role.enum';
import { containersHelptext } from 'app/helptext/containers/containers';
import {
  AvailableUsb,
  ContainerUsbDevice,
} from 'app/interfaces/container.interface';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ContainerDevicesStore } from 'app/pages/containers/stores/container-devices.store';
import { ContainersStore } from 'app/pages/containers/stores/containers.store';
import { isContainerActive } from 'app/pages/containers/utils/container-status.utils';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-add-usb-device-menu',
  templateUrl: './add-usb-device-menu.component.html',
  styleUrls: ['./add-usb-device-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButton,
    MatMenu,
    MatMenuItem,
    MatTooltip,
    TestDirective,
    TranslateModule,
    MatMenuTrigger,
    NgxSkeletonLoaderModule,
    RequiresRolesDirective,
  ],
})
export class AddUsbDeviceMenuComponent {
  protected readonly requiredRoles = [Role.ContainerDeviceWrite];

  private destroyRef = inject(DestroyRef);
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private loader = inject(LoaderService);
  private snackbar = inject(SnackbarService);
  private translate = inject(TranslateService);
  private devicesStore = inject(ContainerDevicesStore);
  private containersStore = inject(ContainersStore);

  protected readonly helptext = containersHelptext;

  // Middleware refuses device operations on any container that is not stopped, so Add is
  // gated exactly like the per-device Edit/Delete menu - otherwise the menu opens, the user
  // picks a device and only then gets a raw refusal.
  protected readonly isContainerActive = computed(() => {
    return isContainerActive(this.containersStore.selectedContainer());
  });

  private readonly usbChoices = toSignal(
    this.api.call('container.device.usb_choices').pipe(
      catchError((error: unknown) => {
        this.errorHandler.showErrorModal(error);
        return of({} as Record<string, AvailableUsb>);
      }),
    ),
    { initialValue: null },
  );

  protected readonly isLoading = computed(() => {
    const devicesLoading = this.devicesStore.isLoading();
    const usbChoices = this.usbChoices();
    return devicesLoading || usbChoices === null;
  });

  protected readonly availableUsbDevices = computed(() => {
    const usbChoices = this.usbChoices();
    if (!usbChoices) {
      return [];
    }

    const existingUsbDevices = this.devicesStore.devices()
      .filter((device) => device.dtype === ContainerDeviceType.Usb);

    return Object.entries(usbChoices)
      .filter(([devicePath, usb]) => {
        if (!usb?.description || !usb.available) {
          return false;
        }
        const isAlreadyAdded = existingUsbDevices.some((device) => {
          if (device.device) {
            return device.device === devicePath;
          }
          // Devices recorded by vendor/product IDs match any port they are plugged into.
          return device.usb?.vendor_id === usb.capability?.vendor_id
            && device.usb?.product_id === usb.capability?.product_id;
        });
        return !isAlreadyAdded;
      })
      .map(([devicePath, usb]) => ({ ...usb, devicePath }));
  });

  protected readonly hasDevicesToAdd = computed(() => {
    return this.availableUsbDevices().length > 0;
  });

  /**
   * Records the physical port (the default): it stays stable across reboots and allows
   * two identical devices to be attached at the same time.
   */
  protected addUsbByPort(usb: AvailableUsb & { devicePath: string }): void {
    this.addDevice({
      dtype: ContainerDeviceType.Usb,
      device: usb.devicePath,
      usb: null,
    } as ContainerUsbDevice);
  }

  /**
   * Records vendor/product IDs instead: the device is matched no matter which port
   * it is plugged into.
   */
  protected addUsbByIds(usb: AvailableUsb & { devicePath: string }): void {
    this.addDevice({
      dtype: ContainerDeviceType.Usb,
      device: null,
      usb: {
        vendor_id: usb.capability.vendor_id,
        product_id: usb.capability.product_id,
      },
    } as ContainerUsbDevice);
  }

  private addDevice(payload: Partial<ContainerUsbDevice>): void {
    const instanceId = this.containersStore.selectedContainer()?.id;
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
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('USB Device was added'));
        this.devicesStore.reload();
      });
  }
}
