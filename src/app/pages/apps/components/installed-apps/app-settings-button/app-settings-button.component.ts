import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, DestroyRef, inject, ViewContainerRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnButtonComponent, TnDialog, TnIconComponent, TnMenuComponent, TnMenuItemComponent, TnMenuTriggerDirective, TnTooltipDirective } from '@truenas/ui-components';
import {
  filter, forkJoin, switchMap,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { helptextApps } from 'app/helptext/apps/apps';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { AppsSettingsComponent } from 'app/pages/apps/components/catalog-settings/apps-settings.component';
import { appSettingsButtonElements } from 'app/pages/apps/components/installed-apps/app-settings-button/app-settings-button.elements';
import { SelectPoolDialog } from 'app/pages/apps/components/select-pool-dialog/select-pool-dialog.component';
import { AppsStore } from 'app/pages/apps/store/apps-store.service';
import { DockerStore } from 'app/pages/apps/store/docker.store';

@Component({
  selector: 'ix-app-settings-button',
  templateUrl: './app-settings-button.component.html',
  styleUrls: ['./app-settings-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnButtonComponent,
    TnIconComponent,
    UiSearchDirective,
    TnMenuTriggerDirective,
    TranslateModule,
    TnMenuComponent,
    RequiresRolesDirective,
    TnMenuItemComponent,
    TnTooltipDirective,
    AsyncPipe,
  ],
})
export class AppSettingsButtonComponent {
  private ixSlideIn = inject(SlideIn);
  private dialogService = inject(DialogService);
  private tnDialog = inject(TnDialog);
  private translate = inject(TranslateService);
  private snackbar = inject(SnackbarService);
  protected dockerStore = inject(DockerStore);
  protected appsStore = inject(AppsStore);
  private viewContainerRef = inject(ViewContainerRef);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);

  readonly searchableElements = appSettingsButtonElements;
  protected readonly updateDockerRoles = [Role.DockerWrite];

  protected readonly helptext = helptextApps;

  // tn-menu-item renders as a button, not an anchor, so these navigation items
  // can't use [routerLink] — route programmatically instead of from the template.
  protected goTo(commands: string[]): void {
    this.router.navigate(commands);
  }

  onChoosePool(): void {
    this.tnDialog
      .open(SelectPoolDialog, { viewContainerRef: this.viewContainerRef })
      .closed
      .pipe(filter(Boolean), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.appsStore.loadCatalog());
  }

  onUnsetPool(): void {
    this.dialogService.confirm({
      title: this.translate.instant(helptextApps.choosePool.unsetPool.confirm.title),
      message: this.translate.instant(helptextApps.choosePool.unsetPool.confirm.message),
      hideCheckbox: true,
      buttonText: this.translate.instant(helptextApps.choosePool.unsetPool.confirm.button),
    }).pipe(filter(Boolean), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.dockerStore.setDockerPool(null).pipe(
        takeUntilDestroyed(this.destroyRef),
      ).subscribe(() => {
        this.snackbar.success(this.translate.instant('Pool has been unset.'));
      });
    });
  }

  manageCatalog(): void {
    this.ixSlideIn.open(AppsSettingsComponent).success$.pipe(
      switchMap(() => forkJoin([
        this.dockerStore.reloadDockerConfig(),
        this.appsStore.loadCatalog(),
      ])),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();
  }
}
