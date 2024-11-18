import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  EMPTY, Observable, switchMap, tap,
} from 'rxjs';
import { VirtualizationDevice } from 'app/interfaces/virtualization.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { VirtualizationInstancesStore } from 'app/pages/virtualization/stores/virtualization-instances.store';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { ApiService } from 'app/services/websocket/api.service';

@UntilDestroy()
@Component({
  selector: 'ix-delete-device-button',
  templateUrl: './delete-device-button.component.html',
  styleUrls: ['./delete-device-button.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    TestDirective,
    IxIconComponent,
    MatIconButton,
    MatTooltip,
  ],
})
export class DeleteDeviceButtonComponent {
  readonly device = input.required<VirtualizationDevice>();

  constructor(
    private dialog: DialogService,
    private api: ApiService,
    private errorHandler: ErrorHandlerService,
    private translate: TranslateService,
    private snackbar: SnackbarService,
    private instanceStore: VirtualizationInstancesStore,
    private loader: AppLoaderService,
  ) {}

  protected deletePressed(): void {
    this.dialog.confirm({
      message: this.translate.instant('Are you sure you want to delete this device?'),
      title: this.translate.instant('Delete Device'),
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
    return this.api.call('virt.instance.device_delete', [this.instanceStore.selectedInstance().id, this.device().name]).pipe(
      this.loader.withLoader(),
      this.errorHandler.catchError(),
      tap(() => {
        this.snackbar.success(this.translate.instant('Device deleted'));
        this.instanceStore.deviceDeleted(this.device().name);
      }),
    );
  }
}
