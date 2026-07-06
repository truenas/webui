import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { TnDialog, TnIconButtonComponent, TnIconComponent } from '@truenas/ui-components';
import { filter } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { helptextTopbar } from 'app/helptext/topbar';
import { powerMenuElements } from 'app/modules/layout/topbar/power-menu/power-menu.elements';
import { RebootOrShutdownDialog } from 'app/modules/layout/topbar/reboot-or-shutdown-dialog/reboot-or-shutdown-dialog.component';
import { TestDirective } from 'app/modules/test-id/test.directive';

@Component({
  selector: 'ix-power-menu',
  templateUrl: './power-menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnIconButtonComponent,
    MatMenuTrigger,
    TnIconComponent,
    MatMenu,
    MatMenuItem,
    TranslateModule,
    RequiresRolesDirective,
    UiSearchDirective,
    TestDirective,
  ],
})
export class PowerMenuComponent {
  private tnDialog = inject(TnDialog);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  protected readonly tooltips = helptextTopbar.tooltips;
  protected readonly requiredRoles = [Role.FullAdmin];
  protected searchableElements = powerMenuElements;

  onReboot(): void {
    this.tnDialog.open<RebootOrShutdownDialog, boolean, string>(RebootOrShutdownDialog, {
      width: '430px',
    }).closed.pipe(
      filter(Boolean),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((reason: string) => {
      this.router.navigate(['/system-tasks/restart'], {
        skipLocationChange: true,
        queryParams: { reason },
      });
    });
  }

  onShutdown(): void {
    this.tnDialog.open<RebootOrShutdownDialog, boolean, string>(RebootOrShutdownDialog, {
      width: '430px',
      data: true,
    }).closed.pipe(
      filter(Boolean),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((reason: string) => {
      this.router.navigate(['/system-tasks/shutdown'], {
        skipLocationChange: true,
        queryParams: { reason },
      });
    });
  }
}
