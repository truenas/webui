import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { catchError, of } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { ContainerDeviceType } from 'app/enums/container.enum';
import { Role } from 'app/enums/role.enum';
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
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-add-usb-device-menu',
  templateUrl: './add-usb-device-menu.component.html',
  styleUrls: ['./add-usb-device-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButton,
    MatMenu,
    MatMenuItem,
    TestDirective,
    TranslateModule,
    MatMenuTrigger,
    NgxSkeletonLoaderModule,
    RequiresRolesDirective,
  ],
})
export class AddUsbDeviceMenuComponent {
  protected readonly requiredRoles = [Role.ContainerWrite];

  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private loader = inject(LoaderService);
  private snackbar = inject(SnackbarService);
  private translate = inject(TranslateService);
  private devicesStore = inject(ContainerDevicesStore);
  private containersStore = inject(ContainersStore);

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

    return Object.values(usbChoices).filter((usb) => {
      if (!usb?.capability?.product_id || !usb?.description) {
        return false;
      }
      const isAlreadyAdded = existingUsbDevices
        .some((device) => device.usb?.product_id === usb.capability.product_id);
      return usb.available && !isAlreadyAdded;
    });
  });

  protected readonly hasDevicesToAdd = computed(() => {
    return this.availableUsbDevices().length > 0;
  });

  protected addUsb(usb: AvailableUsb): void {
    this.addDevice({
      dtype: ContainerDeviceType.Usb,
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
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('USB Device was added'));
        this.devicesStore.loadDevices();
      });
  }
}
