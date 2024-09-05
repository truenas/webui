import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { CommonDirectivesModule } from 'app/directives/common-directives.module';
import { Role } from 'app/enums/role.enum';
import { helptextTopbar } from 'app/helptext/topbar';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { powerMenuElements } from 'app/modules/layout/topbar/power-menu/power-menu.elements';
import { TestIdModule } from 'app/modules/test-id/test-id.module';

@UntilDestroy()
@Component({
  selector: 'ix-power-menu',
  templateUrl: './power-menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatIconButton,
    TestIdModule,
    MatTooltip,
    MatMenuTrigger,
    CommonDirectivesModule,
    IxIconModule,
    MatMenu,
    MatMenuItem,
    TranslateModule,
  ],
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
