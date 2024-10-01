import {
  ChangeDetectionStrategy, Component, computed, effect, input, output,
  signal,
  WritableSignal,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { isEmpty } from 'lodash-es';
import {
  filter, map, switchMap, take, tap,
} from 'rxjs';
import { appImagePlaceholder, customApp } from 'app/constants/catalog.constants';
import { AppState } from 'app/enums/app-state.enum';
import { Role } from 'app/enums/role.enum';
import { helptextApps } from 'app/helptext/apps/apps';
import { AppUpgradeDialogConfig } from 'app/interfaces/app-upgrade-dialog-config.interface';
import { App } from 'app/interfaces/app.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { AppRollbackModalComponent } from 'app/pages/apps/components/installed-apps/app-rollback-modal/app-rollback-modal.component';
import { AppUpgradeDialogComponent } from 'app/pages/apps/components/installed-apps/app-upgrade-dialog/app-upgrade-dialog.component';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { InstalledAppsStore } from 'app/pages/apps/store/installed-apps-store.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { RedirectService } from 'app/services/redirect.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-app-info-card',
  templateUrl: './app-info-card.component.html',
  styleUrls: ['./app-info-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppInfoCardComponent {
  readonly app = input<App>();
  readonly startApp = output();
  readonly stopApp = output();
  protected readonly isCustomApp = computed(() => this.app()?.metadata?.name === customApp);
  protected readonly requiredRoles = [Role.AppsWrite];
  protected readonly hasUpdates = computed(() => this.app()?.upgrade_available);
  protected readonly isAppStopped = computed<boolean>(() => this.app()?.state === AppState.Stopped);
  protected readonly inProgress = computed<boolean>(() => [AppState.Deploying].includes(this.app()?.state));
  protected readonly imagePlaceholder = appImagePlaceholder;
  protected readonly isEmpty = isEmpty;
  protected readonly isRollbackPossible: WritableSignal<boolean> = signal(false);
  protected rollbackUpdateButtonSetEffect = effect(() => {
    const app = this.app();
    this.isRollbackPossible.set(false);
    this.updateRollbackSetup(app.name);
  }, { allowSignalWrites: true });
  protected readonly appDetailsRouterUrl = computed<string[]>(() => {
    const app = this.app();
    return ['/apps', 'available', app.metadata.train, app.id];
  });

  constructor(
    private ws: WebSocketService,
    private loader: AppLoaderService,
    private redirect: RedirectService,
    private errorHandler: ErrorHandlerService,
    private appService: ApplicationsService,
    private matDialog: MatDialog,
    private dialogService: DialogService,
    private translate: TranslateService,
    private router: Router,
    private installedAppsStore: InstalledAppsStore,
  ) {}

  portalLink(app: App, name = 'web_portal'): void {
    this.redirect.openWindow(app.portals[name]);
  }

  updateButtonPressed(): void {
    const name = this.app().name;
    this.appService.getAppUpgradeSummary(name).pipe(
      this.loader.withLoader(),
      switchMap(
        (summary) => this.matDialog.open(AppUpgradeDialogComponent, {
          width: '50vw',
          minWidth: '500px',
          maxWidth: '750px',
          data: {
            appInfo: this.app(),
            upgradeSummary: summary,
          } as AppUpgradeDialogConfig,
        }).afterClosed(),
      ),
      filter(Boolean),
      switchMap(
        (version: string) => this.dialogService.jobDialog(
          this.ws.job('app.upgrade', [name, { app_version: version }]),
          { title: helptextApps.apps.upgrade_dialog.job },
        ).afterClosed(),
      ),
      this.errorHandler.catchError(),
      untilDestroyed(this),
    ).subscribe();
  }

  editButtonPressed(): void {
    const app = this.app();
    this.router.navigate(['/apps', 'installed', app.metadata.train, app.id, 'edit']);
  }

  deleteButtonPressed(): void {
    const name = this.app().name;

    this.dialogService.confirm({
      title: helptextApps.apps.delete_dialog.title,
      message: this.translate.instant('Delete {name}?', { name }),
      secondaryCheckbox: true,
      secondaryCheckboxText: this.translate.instant('Remove iX Volumes'),
    })
      .pipe(filter(({ confirmed }) => Boolean(confirmed)), untilDestroyed(this))
      .subscribe(({ secondaryCheckbox }) => this.executeDelete(name, secondaryCheckbox));
  }

  executeDelete(name: string, removeIxVolumes = false): void {
    this.dialogService.jobDialog(
      this.ws.job('app.delete', [name, { remove_images: true, remove_ix_volumes: removeIxVolumes }]),
      { title: helptextApps.apps.delete_dialog.job },
    )
      .afterClosed()
      .pipe(
        filter(Boolean),
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.installedAppsStore.installedApps$.pipe(
          map((apps) => !apps.length),
          filter(Boolean),
          take(1),
          untilDestroyed(this),
        ).subscribe(() => {
          this.router.navigate(['/apps', 'installed'], { state: { hideMobileDetails: true } });
        });
      });
  }

  rollbackApp(): void {
    this.matDialog
      .open(AppRollbackModalComponent, { data: this.app() })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe();
  }

  private updateRollbackSetup(appName: string): void {
    this.ws.call('app.rollback_versions', [appName]).pipe(
      tap((versions) => this.isRollbackPossible.set(versions.length > 0)),
      untilDestroyed(this),
    ).subscribe();
  }
}
