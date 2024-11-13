import {
  ChangeDetectionStrategy, Component, computed,
} from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatCard, MatCardContent, MatCardHeader } from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import {
  EMPTY, Observable, switchMap, tap,
} from 'rxjs';
import { VirtualizationDeviceType, virtualizationDeviceTypeLabels } from 'app/enums/virtualization.enum';
import {
  VirtualizationDevice,
} from 'app/interfaces/virtualization.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { VirtualizationInstancesStore } from 'app/pages/virtualization/stores/virtualization-instances.store';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-instance-devices',
  templateUrl: './instance-devices.component.html',
  styleUrls: ['./instance-devices.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCard,
    MatCardHeader,
    TranslateModule,
    MatCardContent,
    NgxSkeletonLoaderModule,
    MatIconButton,
    TestDirective,
    IxIconComponent,
  ],
})
export class InstanceDevicesComponent {
  protected readonly isLoadingDevices = this.instanceStore.isLoadingDevices;

  protected readonly shownDevices = computed(() => {
    return this.instanceStore.selectedInstanceDevices().filter((device) => {
      return [VirtualizationDeviceType.Usb, VirtualizationDeviceType.Gpu].includes(device.dev_type);
    });
  });

  constructor(
    private instanceStore: VirtualizationInstancesStore,
    private dialog: DialogService,
    private translate: TranslateService,
    private snackbar: SnackbarService,
    private ws: WebSocketService,
    private loader: AppLoaderService,
    private errorHandler: ErrorHandlerService,
  ) {}

  protected getDeviceDescription(device: VirtualizationDevice): string {
    const type = virtualizationDeviceTypeLabels.has(device.dev_type)
      ? virtualizationDeviceTypeLabels.get(device.dev_type)
      : device.dev_type;

    // TODO: Get better names.
    const description = device.name;

    return `${type}: ${description}`;
  }

  protected deleteProxyPressed(device: VirtualizationDevice): void {
    this.dialog.confirm({
      message: this.translate.instant('Are you sure you want to delete this device?'),
      title: this.translate.instant('Delete Device'),
    })
      .pipe(
        switchMap((confirmed) => {
          if (!confirmed) {
            return EMPTY;
          }

          return this.deleteDevice(device);
        }),
        untilDestroyed(this),
      )
      .subscribe();
  }

  private deleteDevice(proxy: VirtualizationDevice): Observable<unknown> {
    return this.ws.call('virt.instance.device_delete', [this.instanceStore.selectedInstance().id, proxy.name]).pipe(
      this.loader.withLoader(),
      this.errorHandler.catchError(),
      tap(() => {
        this.snackbar.success(this.translate.instant('Device deleted'));
        this.instanceStore.loadDevices();
      }),
    );
  }
}
