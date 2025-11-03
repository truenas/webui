import { ChangeDetectionStrategy, Component, computed, input, output, inject } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  EMPTY, NEVER, Observable, switchMap, tap,
} from 'rxjs';
import { VirtualizationDeviceType, VirtualizationStatus } from 'app/enums/virtualization.enum';
import { VirtualizationDevice } from 'app/interfaces/container.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { getDeviceDescription } from 'app/pages/instances/components/common/utils/get-device-description.utils';
import { VirtualizationDevicesStore } from 'app/pages/instances/stores/virtualization-devices.store';
import { VirtualizationInstancesStore } from 'app/pages/instances/stores/virtualization-instances.store';
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
  ],
})
export class DeviceActionsMenuComponent {
  private dialog = inject(DialogService);
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private translate = inject(TranslateService);
  private snackbar = inject(SnackbarService);
  private devicesStore = inject(VirtualizationDevicesStore);
  private instancesStore = inject(VirtualizationInstancesStore);
  private loader = inject(LoaderService);

  readonly device = input.required<VirtualizationDevice>();
  readonly showEdit = input(true);
  readonly isDisabled = input(false);

  readonly edit = output();

  protected readonly canManage = computed(() => {
    return !this.manageRestrictedExplanation() && !this.isDisabled();
  });

  protected readonly manageRestrictedExplanation = computed(() => {
    if (this.device().readonly) {
      return this.translate.instant('This device is read-only and cannot be edited.');
    }

    const isInstanceStopped = this.instancesStore.selectedInstance()?.status?.state === VirtualizationStatus.Stopped;
    if (this.device().dev_type === VirtualizationDeviceType.Tpm && !isInstanceStopped) {
      return this.translate.instant('This device cannot be edited while the instance is running.');
    }

    return null;
  });

  protected deletePressed(): void {
    this.dialog.confirm({
      message: this.translate.instant(
        'Are you sure you want to delete {item}?',
        { item: getDeviceDescription(this.translate, this.device()) },
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
          this.snackbar.success(this.translate.instant('Device deleted'));
          this.devicesStore.deviceDeleted(deviceId);
        }),
      );
  }
}
