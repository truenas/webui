import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import helptext from 'app/helptext/topbar';
import { DialogService, WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'ix-power-menu',
  templateUrl: './power-menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PowerMenuComponent {
  readonly tooltips = helptext.mat_tooltips;

  constructor(
    private ws: WebSocketService,
    private translate: TranslateService,
    private dialogService: DialogService,
    private router: Router,
  ) { }

  onSignOut(): void {
    this.ws.logout();
  }

  onReboot(): void {
    this.dialogService.confirm({
      title: this.translate.instant('Restart'),
      message: this.translate.instant('Restart the system?'),
      buttonMsg: this.translate.instant('Restart'),
    }).pipe(
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe(() => {
      this.router.navigate(['/others/reboot']);
    });
  }

  onShutdown(): void {
    this.dialogService.confirm({
      title: this.translate.instant('Shut down'),
      message: this.translate.instant('Shut down the system?'),
      buttonMsg: this.translate.instant('Shut Down'),
    }).pipe(
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe(() => {
      this.router.navigate(['/others/shutdown']);
    });
  }
}
