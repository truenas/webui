import { ChangeDetectionStrategy, Component, computed, input, output, inject } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  EMPTY, NEVER, Observable, filter, switchMap, tap,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { ContainerDeviceType, ContainerNicDeviceType } from 'app/enums/container.enum';
import { Role } from 'app/enums/role.enum';
import {
  ContainerDevice,
  ContainerFilesystemDevice,
  ContainerNicDevice,
} from 'app/interfaces/container.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  InstanceFilesystemDeviceFormComponent,
} from 'app/pages/instances/components/all-instances/instance-details/instance-filesystem-devices/instance-filesystem-device-form/instance-filesystem-device-form.component';
import { InstanceNicFormDialog } from 'app/pages/instances/components/common/instance-nic-form-dialog/instance-nic-form-dialog.component';
import { getDeviceDescription } from 'app/pages/instances/components/common/utils/get-device-description.utils';
import { ContainerDevicesStore } from 'app/pages/instances/stores/container-devices.store';
import { ContainerInstancesStore } from 'app/pages/instances/stores/container-instances.store';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-device-actions-menu',
  templateUrl: './device-actions-menu.component.html',
  styleUrls: ['./device-actions-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    TestDirective,
    IxIconComponent,
    MatIconButton,
    MatTooltip,
    MatMenu,
    MatMenuTrigger,
    MatMenuItem,
    RequiresRolesDirective,
  ],
})
export class DeviceActionsMenuComponent {
  protected readonly requiredRoles = [Role.ContainerWrite];

  private dialog = inject(DialogService);
  private matDialog = inject(MatDialog);
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private translate = inject(TranslateService);
  private snackbar = inject(SnackbarService);
  private devicesStore = inject(ContainerDevicesStore);
  private instancesStore = inject(ContainerInstancesStore);
  private loader = inject(LoaderService);
  private slideIn = inject(SlideIn);

  readonly device = input.required<ContainerDevice>();
  readonly showEdit = input(true);
  readonly isDisabled = input(false);
  readonly disabledTooltip = input<string | null>(null);

  readonly edit = output();

  protected readonly deviceDescription = computed(() => {
    return getDeviceDescription(this.translate, this.device());
  });

  protected readonly isStorageDevice = computed(() => {
    return this.device().dtype === ContainerDeviceType.Filesystem;
  });

  protected readonly canManage = computed(() => {
    return !this.manageRestrictedExplanation() && !this.isDisabled();
  });

  protected readonly manageRestrictedExplanation = computed(() => {
    if (this.isDisabled() && this.disabledTooltip()) {
      return this.disabledTooltip();
    }

    return null;
  });

  protected editPressed(): void {
    const device = this.device();

    // For filesystem devices, open the form
    if (this.isStorageDevice()) {
      const instance = this.instancesStore.selectedInstance();
      if (!instance) {
        return;
      }

      this.slideIn.open(InstanceFilesystemDeviceFormComponent, {
        data: {
          instance,
          disk: device as ContainerFilesystemDevice,
        },
      }).pipe(untilDestroyed(this)).subscribe((result) => {
        if (result.response) {
          this.devicesStore.loadDevices();
        }
      });
      return;
    }

    // For NIC devices, open the dialog
    if (device.dtype === ContainerDeviceType.Nic) {
      this.matDialog.open(InstanceNicFormDialog, {
        data: {
          device: device as ContainerNicDevice & { id: number },
        },
        minWidth: '500px',
      }).afterClosed().pipe(
        filter(Boolean),
        switchMap((config: {
          mac?: string;
          useDefault: boolean;
          type: ContainerNicDeviceType;
          trust_guest_rx_filters?: boolean;
        }) => {
          const nicDevice = device as ContainerNicDevice;
          if (!nicDevice.id) {
            return NEVER;
          }

          const payload: ContainerNicDevice = {
            dtype: ContainerDeviceType.Nic,
            type: config.type,
            nic_attach: nicDevice.nic_attach,
            mac: config.mac || null,
          };

          // Only include trust_guest_rx_filters if it's present in config
          // (dialog only includes it for VIRTIO devices)
          if (config.trust_guest_rx_filters !== undefined) {
            payload.trust_guest_rx_filters = config.trust_guest_rx_filters;
          }

          return this.api.call('container.device.update', [nicDevice.id, {
            attributes: payload,
          }]).pipe(
            this.loader.withLoader(),
            this.errorHandler.withErrorHandler(),
          );
        }),
        untilDestroyed(this),
      ).subscribe(() => {
        this.snackbar.success(this.translate.instant('NIC Device was updated'));
        this.devicesStore.loadDevices();
      });
      return;
    }

    // For other devices, emit the edit event
    this.edit.emit();
  }

  protected deletePressed(): void {
    this.dialog.confirm({
      message: this.translate.instant(
        'Are you sure you want to delete {item}?',
        { item: this.deviceDescription() },
      ),
      title: this.translate.instant('Delete Item'),
    })
      .pipe(
        switchMap((confirmed) => {
          if (!confirmed) {
            return EMPTY;
          }

          return this.deleteDevice();
        }),
        untilDestroyed(this),
      )
      .subscribe();
  }

  private deleteDevice(): Observable<unknown> {
    const deviceId = this.device().id;
    if (!deviceId) {
      return NEVER;
    }
    return this.api.call('container.device.delete', [deviceId])
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.withErrorHandler(),
        tap(() => {
          this.snackbar.success(this.translate.instant('Device was deleted'));
          this.devicesStore.deviceDeleted(deviceId);
        }),
      );
  }
}
