import { ChangeDetectionStrategy, Component, ViewContainerRef, input, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  filter, Observable, of, switchMap, take,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { AvailableApp } from 'app/interfaces/available-app.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { SelectPoolDialog } from 'app/pages/apps/components/select-pool-dialog/select-pool-dialog.component';
import { DockerStore } from 'app/pages/apps/store/docker.store';

@UntilDestroy()
@Component({
  selector: 'ix-install-app-button',
  styleUrls: ['./install-app-button.component.scss'],
  templateUrl: './install-app-button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButton,
    RequiresRolesDirective,
    TranslateModule,
    TestDirective,
  ],
})
export class InstallAppButtonComponent {
  private dockerStore = inject(DockerStore);
  private router = inject(Router);
  private matDialog = inject(MatDialog);
  private authService = inject(AuthService);
  private dialogService = inject(DialogService);
  private translate = inject(TranslateService);
  private api = inject(ApiService);
  private viewContainerRef = inject(ViewContainerRef);

  readonly app = input<AvailableApp>();

  protected readonly appInstallRole = [Role.AppsWrite];
  protected readonly selectPoolRole = [Role.DockerWrite];

  protected readonly selectedPool = toSignal(this.dockerStore.selectedPool$);

  private showAgreementWarning(): Observable<unknown> {
    return this.authService.user$.pipe(
      take(1),
      filter((user) => !!user),
      switchMap((user) => {
        return user.attributes.appsAgreement
          ? of(true)
          : this.dialogService.confirm({
            title: this.translate.instant('Warning'),
            message: this.translate.instant(`Using 3rd party applications with TrueNAS extends its
              functionality beyond standard NAS use, which can introduce risks like data loss or system disruption. <br /><br />
              TrueNAS does not guarantee application safety or reliability, and such applications may not
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
    this.showAgreementWarning().pipe(untilDestroyed(this)).subscribe(() => {
      this.router.navigate(['/apps', 'available', this.app()?.train, this.app()?.name, 'install']);
    });
  }

  showChoosePoolModal(): void {
    this.showAgreementWarning().pipe(
      switchMap(() => this.matDialog.open(SelectPoolDialog, { viewContainerRef: this.viewContainerRef }).afterClosed()),
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe(() => this.navigateToInstallPage());
  }
}
