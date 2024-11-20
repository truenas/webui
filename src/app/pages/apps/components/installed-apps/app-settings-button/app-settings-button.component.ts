import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, Injector, ViewContainerRef,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { RouterLink } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { helptextApps } from 'app/helptext/apps/apps';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { AppsSettingsComponent } from 'app/pages/apps/components/catalog-settings/apps-settings.component';
import { appSettingsButtonElements } from 'app/pages/apps/components/installed-apps/app-settings-button/app-settings-button.elements';
import { SelectPoolDialogComponent } from 'app/pages/apps/components/select-pool-dialog/select-pool-dialog.component';
import { DockerStore } from 'app/pages/apps/store/docker.store';
import { SlideInService } from 'app/services/slide-in.service';

@UntilDestroy()
@Component({
  selector: 'ix-app-settings-button',
  templateUrl: './app-settings-button.component.html',
  styleUrls: ['./app-settings-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatButton,
    TestDirective,
    UiSearchDirective,
    MatMenuTrigger,
    TranslateModule,
    IxIconComponent,
    MatMenu,
    RequiresRolesDirective,
    MatMenuItem,
    RouterLink,
    AsyncPipe,
  ],
})
export class AppSettingsButtonComponent {
  readonly searchableElements = appSettingsButtonElements;
  protected readonly updateDockerRoles = [Role.DockerWrite];

  constructor(
    private ixSlideInService: SlideInService,
    private dialogService: DialogService,
    private matDialog: MatDialog,
    private translate: TranslateService,
    private snackbar: SnackbarService,
    protected dockerStore: DockerStore,
    private viewContainerRef: ViewContainerRef,
    private injector: Injector,
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

  manageCatalog(): void {
    this.ixSlideInService.open(AppsSettingsComponent, { injector: this.injector });
  }
}
