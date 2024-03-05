import {
  ChangeDetectionStrategy, Component, ViewContainerRef,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs';
import { officialCatalog } from 'app/constants/catalog.constants';
import { Role } from 'app/enums/role.enum';
import { helptextApps } from 'app/helptext/apps/apps';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { KubernetesSettingsComponent } from 'app/pages/apps/components/installed-apps/kubernetes-settings/kubernetes-settings.component';
import { SelectPoolDialogComponent } from 'app/pages/apps/components/select-pool-dialog/select-pool-dialog.component';
import { KubernetesStore } from 'app/pages/apps/store/kubernetes-store.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-app-settings-button',
  templateUrl: './app-settings-button.component.html',
  styleUrls: ['./app-settings-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppSettingsButtonComponent {
  readonly officialCatalog = officialCatalog;

  protected readonly requiredRoles = [Role.KubernetesWrite];

  constructor(
    private ws: WebSocketService,
    private slideInService: IxSlideInService,
    private dialogService: DialogService,
    private matDialog: MatDialog,
    private translate: TranslateService,
    private snackbar: SnackbarService,
    private errorHandler: ErrorHandlerService,
    protected kubernetesStore: KubernetesStore,
    private viewContainerRef: ViewContainerRef,
  ) { }

  onChoosePool(): void {
    this.matDialog.open(SelectPoolDialogComponent, { viewContainerRef: this.viewContainerRef });
  }

  onAdvancedSettings(): void {
    this.slideInService.open(KubernetesSettingsComponent);
  }

  onUnsetPool(): void {
    this.dialogService.confirm({
      title: helptextApps.choosePool.unsetPool.confirm.title,
      message: helptextApps.choosePool.unsetPool.confirm.message,
      hideCheckbox: true,
      buttonText: helptextApps.choosePool.unsetPool.confirm.button,
    }).pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
      this.dialogService.jobDialog(
        this.ws.job('kubernetes.update', [{ pool: null }]),
        { title: helptextApps.choosePool.jobTitle },
      )
        .afterClosed()
        .pipe(this.errorHandler.catchError(), untilDestroyed(this))
        .subscribe(() => {
          this.kubernetesStore.updateSelectedPool(null);
          this.snackbar.success(this.translate.instant('Pool has been unset.'));
        });
    });
  }
}
