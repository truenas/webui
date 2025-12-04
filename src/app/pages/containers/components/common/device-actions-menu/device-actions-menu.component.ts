import { ChangeDetectionStrategy, Component, computed, DestroyRef, input, output, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
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
  ContainerFilesystemDeviceFormComponent,
} from 'app/pages/containers/components/all-containers/container-details/container-filesystem-devices/container-filesystem-device-form/container-filesystem-device-form.component';
import { ContainerNicFormDialog } from 'app/pages/containers/components/common/container-nic-form-dialog/container-nic-form-dialog.component';
import { getDeviceDescription } from 'app/pages/containers/components/common/utils/get-device-description.utils';
import { ContainerDevicesStore } from 'app/pages/containers/stores/container-devices.store';
import { ContainersStore } from 'app/pages/containers/stores/containers.store';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

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

  private destroyRef = inject(DestroyRef);
  private dialog = inject(DialogService);
  private matDialog = inject(MatDialog);
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private translate = inject(TranslateService);
  private snackbar = inject(SnackbarService);
  private devicesStore = inject(ContainerDevicesStore);
  private containersStore = inject(ContainersStore);
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
      const container = this.containersStore.selectedContainer();
      if (!container) {
        return;
      }

      this.slideIn.open(ContainerFilesystemDeviceFormComponent, {
        data: {
          container,
          disk: device as ContainerFilesystemDevice,
        },
      }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe((result) => {
        if (result.response) {
          this.devicesStore.reload();
        }
      });
      return;
    }

    // For NIC devices, open the dialog
    if (device.dtype === ContainerDeviceType.Nic) {
      this.matDialog.open(ContainerNicFormDialog, {
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
        takeUntilDestroyed(this.destroyRef),
      ).subscribe(() => {
        this.snackbar.success(this.translate.instant('NIC Device was updated'));
        this.devicesStore.reload();
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
        takeUntilDestroyed(this.destroyRef),
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
