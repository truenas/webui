import {
  ChangeDetectionStrategy, Component, Input,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  filter, map, Observable, of, switchMap, take, tap,
} from 'rxjs';
import { AvailableApp } from 'app/interfaces/available-app.interface';
import { SelectPoolDialogComponent } from 'app/pages/apps/components/select-pool-dialog/select-pool-dialog.component';
import { InstalledAppsStore } from 'app/pages/apps/store/installed-apps-store.service';
import { KubernetesStore } from 'app/pages/apps/store/kubernetes-store.service';
import { AuthService } from 'app/services/auth/auth.service';
import { DialogService } from 'app/services/dialog.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-app-details-header',
  templateUrl: './app-details-header.component.html',
  styleUrls: ['./app-details-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppDetailsHeaderComponent {
  @Input() app: AvailableApp;
  @Input() isLoading$: Observable<boolean>;

  constructor(
    public kubernetesStore: KubernetesStore,
    private router: Router,
    private matDialog: MatDialog,
    private installedAppsStore: InstalledAppsStore,
    private authService: AuthService,
    private dialogService: DialogService,
    private translate: TranslateService,
    private ws: WebSocketService,
  ) {}

  get description(): string {
    const splittedText = this.app?.app_readme?.split('</h1>');
    const readyHtml = splittedText[1] || splittedText[0];
    return readyHtml?.replace(/<[^>]*>/g, '').trim();
  }

  navigateToAllInstalledPage(): void {
    this.installedAppsStore.installedApps$.pipe(
      map((apps) => {
        return apps.filter((app) => {
          return app.chart_metadata.name === this.app.name
            && app.catalog === this.app.catalog
            && app.catalog_train === this.app.train;
        });
      }),
      untilDestroyed(this),
    ).subscribe({
      next: (apps) => {
        if (apps.length) {
          this.router.navigate(['/apps', 'installed', apps[0].name]);
        } else {
          this.router.navigate(['/apps', 'installed']);
        }
      },
    });
  }

  private showAgreementWarning(): Observable<unknown> {
    return this.authService.user$.pipe(
      take(1),
      switchMap((user) => {
        return user.attributes.appsAgreement ? of(true) : this.dialogService.confirm({
          title: this.translate.instant('Information'),
          message: this.translate.instant(`Applications allow you to extend the functionality of the TrueNAS server beyond traditional Network Attached Storage (NAS) workloads, and as such are not covered by iXsystems software support contracts unless explicitly stated. Defective or malicious applications can lead to data loss or exposure, as well possible disruptions of core NAS functionality.

          iXsystems makes no warranty of any kind as to the suitability or safety of using applications. Bug reports in which applications are accessing the same data and filesystem paths as core NAS sharing functionality may be closed without further investigation.`),
          buttonText: this.translate.instant('Agree'),
          cancelText: this.translate.instant('Go Back'),
          disableClose: true,
        }).pipe(
          filter(Boolean),
          switchMap(() => this.ws.call('auth.set_attribute', ['appsAgreement', true])),
          tap(() => this.authService.getLoggedInUserInformation()),
        );
      }),

    );
  }

  navigateToInstallPage(): void {
    this.showAgreementWarning().pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.router.navigate(['/apps', 'available', this.app.catalog, this.app.train, this.app.name, 'install']);
      },
    });
  }

  showChoosePoolModal(): void {
    const dialog = this.matDialog.open(SelectPoolDialogComponent);
    dialog.afterClosed().pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
      this.navigateToInstallPage();
    });
  }
}
