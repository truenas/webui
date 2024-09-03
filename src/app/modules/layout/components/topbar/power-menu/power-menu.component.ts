import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { Role } from 'app/enums/role.enum';
import { helptextTopbar } from 'app/helptext/topbar';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { powerMenuElements } from 'app/modules/layout/components/topbar/power-menu/power-menu.elements';

@UntilDestroy()
@Component({
  selector: 'ix-power-menu',
  templateUrl: './power-menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PowerMenuComponent {
  protected readonly tooltips = helptextTopbar.mat_tooltips;
  protected readonly requiredRoles = [Role.FullAdmin];
  protected searchableElements = powerMenuElements;

  constructor(
    private translate: TranslateService,
    private dialogService: DialogService,
    private router: Router,
  ) { }

  onReboot(): void {
    this.dialogService.confirm({
      title: this.translate.instant('Restart'),
      message: this.translate.instant('Restart the system?'),
      buttonText: this.translate.instant('Restart'),
    }).pipe(
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe(() => {
      this.router.navigate(['/system-tasks/reboot'], { skipLocationChange: true });
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
      this.router.navigate(['/system-tasks/shutdown'], { skipLocationChange: true });
    });
  }
}
