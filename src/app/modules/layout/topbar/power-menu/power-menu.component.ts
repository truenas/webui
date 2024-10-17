import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { helptextTopbar } from 'app/helptext/topbar';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { powerMenuElements } from 'app/modules/layout/topbar/power-menu/power-menu.elements';
import { RebootOrShutdownDialogComponent } from 'app/modules/layout/topbar/reboot-or-shutdown-dialog/reboot-or-shutdown-dialog.component';
import { TestDirective } from 'app/modules/test-id/test.directive';

@UntilDestroy()
@Component({
  selector: 'ix-power-menu',
  templateUrl: './power-menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatIconButton,
    MatTooltip,
    MatMenuTrigger,
    IxIconComponent,
    MatMenu,
    MatMenuItem,
    TranslateModule,
    RequiresRolesDirective,
    UiSearchDirective,
    TestDirective,
  ],
})
export class PowerMenuComponent {
  protected readonly tooltips = helptextTopbar.mat_tooltips;
  protected readonly requiredRoles = [Role.FullAdmin];
  protected searchableElements = powerMenuElements;

  constructor(
    private matDialog: MatDialog,
    private router: Router,
  ) { }

  onReboot(): void {
    this.matDialog.open(RebootOrShutdownDialogComponent, {
      width: '400px',
    }).afterClosed().pipe(
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe((reason: string) => {
      this.router.navigate(['/system-tasks/restart'], {
        skipLocationChange: true,
        queryParams: { reason },
      });
    });
  }

  onShutdown(): void {
    this.matDialog.open(RebootOrShutdownDialogComponent, {
      width: '400px',
      data: true,
    }).afterClosed().pipe(
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe((reason: string) => {
      this.router.navigate(['/system-tasks/shutdown'], {
        skipLocationChange: true,
        queryParams: { reason },
      });
    });
  }
}
