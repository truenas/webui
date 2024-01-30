import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { helptextTopbar } from 'app/helptext/topbar';
import { AuthService } from 'app/services/auth/auth.service';
import { DialogService } from 'app/services/dialog.service';
import { WebSocketConnectionService } from 'app/services/websocket-connection.service';

@UntilDestroy()
@Component({
  selector: 'ix-power-menu',
  templateUrl: './power-menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PowerMenuComponent {
  readonly tooltips = helptextTopbar.mat_tooltips;

  protected isSysAdmin$ = this.authService.isSysAdmin$;

  constructor(
    private authService: AuthService,
    private translate: TranslateService,
    private dialogService: DialogService,
    private router: Router,
    private wsManager: WebSocketConnectionService,
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
