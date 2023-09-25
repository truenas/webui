import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import helptext from 'app/helptext/topbar';
import { AuthService } from 'app/services/auth/auth.service';
import { DialogService } from 'app/services/dialog.service';
import { WebsocketConnectionService } from 'app/services/websocket-connection.service';

@UntilDestroy()
@Component({
  selector: 'ix-power-menu',
  templateUrl: './power-menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PowerMenuComponent {
  readonly tooltips = helptext.mat_tooltips;

  constructor(
    private authService: AuthService,
    private translate: TranslateService,
    private dialogService: DialogService,
    private router: Router,
    private wsManager: WebsocketConnectionService,
  ) { }

  onSignOut(): void {
    this.authService.logout().pipe(untilDestroyed(this)).subscribe();
    this.authService.clearAuthToken();
    this.wsManager.isClosed$ = true;
  }

  onReboot(): void {
    this.dialogService.confirm({
      title: this.translate.instant('Restart'),
      message: this.translate.instant('Restart the system?'),
      buttonText: this.translate.instant('Restart'),
    }).pipe(
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe(() => {
      this.router.navigate(['/others/reboot'], { skipLocationChange: true });
    });
  }

  onShutdown(): void {
    this.dialogService.confirm({
      title: this.translate.instant('Shut down'),
      message: this.translate.instant('Shut down the system?'),
      buttonText: this.translate.instant('Shut Down'),
    }).pipe(
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe(() => {
      this.router.navigate(['/others/shutdown'], { skipLocationChange: true });
    });
  }
}
