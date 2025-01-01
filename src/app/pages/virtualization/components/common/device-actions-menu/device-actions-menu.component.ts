import {
  ChangeDetectionStrategy, Component, input, output,
} from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  EMPTY, NEVER, Observable, switchMap, tap,
} from 'rxjs';
import { VirtualizationDevice } from 'app/interfaces/virtualization.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { getDeviceDescription } from 'app/pages/virtualization/components/common/utils/get-device-description.utils';
import { VirtualizationDevicesStore } from 'app/pages/virtualization/stores/virtualization-devices.store';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { ApiService } from 'app/services/websocket/api.service';

@UntilDestroy()
@Component({
  selector: 'ix-device-actions-menu',
  templateUrl: './device-actions-menu.component.html',
  styleUrls: ['./device-actions-menu.component.scss'],
  standalone: true,
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
  readonly device = input.required<VirtualizationDevice>();
  readonly showEdit = input(true);

  readonly edit = output();

  constructor(
    private dialog: DialogService,
    private api: ApiService,
    private errorHandler: ErrorHandlerService,
    private translate: TranslateService,
    private snackbar: SnackbarService,
    private deviceStore: VirtualizationDevicesStore,
    private loader: AppLoaderService,
  ) {}

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
    const selectedInstanceId = this.deviceStore.selectedInstance()?.id;
    if (!selectedInstanceId) {
      return NEVER;
    }
    return this.api.call('virt.instance.device_delete', [selectedInstanceId, this.device().name])
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.catchError(),
        tap(() => {
          this.snackbar.success(this.translate.instant('Device deleted'));
          this.deviceStore.deviceDeleted(this.device().name);
        }),
      );
  }
}
