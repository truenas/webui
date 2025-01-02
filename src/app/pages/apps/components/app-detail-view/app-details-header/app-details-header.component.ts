import {
  ChangeDetectionStrategy, Component, computed, input, ViewContainerRef,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import {
  filter, Observable, of, switchMap, take,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { AvailableApp } from 'app/interfaces/available-app.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { CleanLinkPipe } from 'app/modules/pipes/clean-link/clean-link.pipe';
import { OrNotAvailablePipe } from 'app/modules/pipes/or-not-available/or-not-available.pipe';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { AppCardLogoComponent } from 'app/pages/apps/components/app-card-logo/app-card-logo.component';
import { InstalledAppBadgeComponent } from 'app/pages/apps/components/installed-app-badge/installed-app-badge.component';
import { SelectPoolDialogComponent } from 'app/pages/apps/components/select-pool-dialog/select-pool-dialog.component';
import { DockerStore } from 'app/pages/apps/store/docker.store';

@UntilDestroy()
@Component({
  selector: 'ix-app-details-header',
  templateUrl: './app-details-header.component.html',
  styleUrls: ['./app-details-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    TranslateModule,
    AppCardLogoComponent,
    MatButton,
    CleanLinkPipe,
    RequiresRolesDirective,
    TestDirective,
    NgxSkeletonLoaderModule,
    InstalledAppBadgeComponent,
    OrNotAvailablePipe,
  ],
})
export class AppDetailsHeaderComponent {
  readonly app = input.required<AvailableApp>();
  readonly isLoading = input<boolean>();
  protected readonly requiredRoles = [Role.AppsWrite];
  protected readonly dockerUpdateRequiredRoles = [Role.DockerWrite];
  protected readonly selectedPool = toSignal(this.dockerStore.selectedPool$);

  constructor(
    protected dockerStore: DockerStore,
    private router: Router,
    private matDialog: MatDialog,
    private authService: AuthService,
    private dialogService: DialogService,
    private translate: TranslateService,
    private api: ApiService,
    private viewContainerRef: ViewContainerRef,
  ) { }

  description = computed<string>(() => {
    const splitText = this.app()?.app_readme?.split('</h1>');
    const readyHtml = splitText?.[1] || splitText?.[0];
    return readyHtml?.replace(/<[^>]*>/g, '').trim();
  });

  private showAgreementWarning(): Observable<unknown> {
    return this.authService.user$.pipe(
      take(1),
      switchMap((user) => {
        return user.attributes.appsAgreement
          ? of(true)
          : this.dialogService.confirm({
            title: this.translate.instant('Warning'),
            message: this.translate.instant(`Using 3rd party applications with TrueNAS extends its
              functionality beyond standard NAS use, which can introduce risks like data loss or system disruption. <br /><br />
              iXsystems does not guarantee application safety or reliability, and such applications may not
              be covered by support contracts. Issues with core NAS functionality may be closed without
              further investigation if the same data or filesystems are accessed by these applications.`),
            buttonText: this.translate.instant('Agree'),
            cancelText: this.translate.instant('Go Back'),
            disableClose: true,
          }).pipe(
            filter(Boolean),
            switchMap(() => this.api.call('auth.set_attribute', ['appsAgreement', true])),
            switchMap(() => this.authService.refreshUser()),
          );
      }),

    );
  }

  navigateToInstallPage(): void {
    this.showAgreementWarning().pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.router.navigate(['/apps', 'available', this.app().train, this.app().name, 'install']);
      },
    });
  }

  showChoosePoolModal(): void {
    this.matDialog.open(SelectPoolDialogComponent, { viewContainerRef: this.viewContainerRef })
      .afterClosed()
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => {
        this.navigateToInstallPage();
      });
  }
}
