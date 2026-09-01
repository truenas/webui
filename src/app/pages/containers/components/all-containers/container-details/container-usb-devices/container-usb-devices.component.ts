import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnCardComponent, TnCardFooterActionsDirective } from '@truenas/ui-components';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { catchError, of } from 'rxjs';
import { ContainerDeviceType } from 'app/enums/container.enum';
import { containersHelptext } from 'app/helptext/containers/containers';
import {
  AvailableUsb,
  ContainerDevice,
  ContainerUsbDevice,
} from 'app/interfaces/container.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  AddUsbDeviceMenuComponent,
} from 'app/pages/containers/components/all-containers/container-details/container-usb-devices/add-usb-device-menu/add-usb-device-menu.component';
import {
  DeviceActionsMenuComponent,
} from 'app/pages/containers/components/common/device-actions-menu/device-actions-menu.component';
import { getDeviceDescription } from 'app/pages/containers/components/common/utils/get-device-description.utils';
import { ContainerDevicesStore } from 'app/pages/containers/stores/container-devices.store';
import { ContainersStore } from 'app/pages/containers/stores/containers.store';
import { isContainerActive } from 'app/pages/containers/utils/container-status.utils';

@Component({
  selector: 'ix-container-usb-devices',
  templateUrl: './container-usb-devices.component.html',
  styleUrls: ['./container-usb-devices.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    TnCardFooterActionsDirective,
    TranslateModule,
    NgxSkeletonLoaderModule,
    DeviceActionsMenuComponent,
    AddUsbDeviceMenuComponent,
  ],
})
export class ContainerUsbDevicesComponent {
  private api = inject(ApiService);
  private devicesStore = inject(ContainerDevicesStore);
  private containersStore = inject(ContainersStore);
  private translate = inject(TranslateService);

  protected readonly isLoadingDevices = this.devicesStore.isLoading;
  protected readonly helptext = containersHelptext;

  // Middleware refuses device operations on any container that is not stopped, which since
  // 26.0 includes SUSPENDED - not just RUNNING.
  protected readonly isContainerActive = computed(() => {
    return isContainerActive(this.containersStore.selectedContainer());
  });

  // Used only to show the human-readable device names; on error the card falls back
  // to the raw identifiers, so no error modal here (the Add menu already surfaces one).
  private readonly usbChoices = toSignal(
    this.api.call('container.device.usb_choices').pipe(
      catchError(() => of({} as Record<string, AvailableUsb>)),
    ),
    { initialValue: {} as Record<string, AvailableUsb> },
  );

  protected readonly shownDevices = computed(() => {
    return this.devicesStore.devices().filter((device) => {
      return device.dtype === ContainerDeviceType.Usb;
    });
  });

  protected getDeviceDescription(device: ContainerDevice): string {
    if (device.dtype === ContainerDeviceType.Usb) {
      const description = this.findUsbDescription(device);
      if (description) {
        return description;
      }
    }

    return getDeviceDescription(this.translate, device);
  }

  private findUsbDescription(device: ContainerUsbDevice): string | null {
    const choices = this.usbChoices();

    if (device.device) {
      return choices[device.device]?.description || null;
    }

    if (device.usb) {
      const match = Object.values(choices).find((choice) => {
        return choice.capability?.vendor_id === device.usb?.vendor_id
          && choice.capability?.product_id === device.usb?.product_id;
      });
      return match?.description || null;
    }

    return null;
  }
}
