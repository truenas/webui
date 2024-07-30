import {
  ChangeDetectionStrategy, Component, ViewContainerRef,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs';
import { officialCatalog } from 'app/constants/catalog.constants';
import { helptextApps } from 'app/helptext/apps/apps';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { appSettingsButtonElements } from 'app/pages/apps/components/installed-apps/app-settings-button/app-settings-button.elements';
import { SelectPoolDialogComponent } from 'app/pages/apps/components/select-pool-dialog/select-pool-dialog.component';
import { DockerStore } from 'app/pages/apps/store/docker.service';
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
  readonly searchableElements = appSettingsButtonElements;

  constructor(
    private ws: WebSocketService,
    private dialogService: DialogService,
    private matDialog: MatDialog,
    private translate: TranslateService,
    private snackbar: SnackbarService,
    protected dockerStore: DockerStore,
    private viewContainerRef: ViewContainerRef,
  ) { }

  onChoosePool(): void {
    this.matDialog.open(SelectPoolDialogComponent, { viewContainerRef: this.viewContainerRef });
  }

  onUnsetPool(): void {
    this.dialogService.confirm({
      title: helptextApps.choosePool.unsetPool.confirm.title,
      message: helptextApps.choosePool.unsetPool.confirm.message,
      hideCheckbox: true,
      buttonText: helptextApps.choosePool.unsetPool.confirm.button,
    }).pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
      this.dockerStore.setDockerPool(null).pipe(
        untilDestroyed(this),
      ).subscribe(() => {
        this.snackbar.success(this.translate.instant('Pool has been unset.'));
      });
    });
  }
}
