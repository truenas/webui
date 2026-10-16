import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import {
  TnDialog,
  TnIconButtonComponent,
  TnMenuComponent,
  TnMenuItemComponent,
  TnMenuTriggerDirective,
} from '@truenas/ui-components';
import { filter } from 'rxjs/operators';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { helptextTopbar } from 'app/helptext/topbar';
import { AuthService } from 'app/modules/auth/auth.service';
import { powerMenuElements } from 'app/modules/layout/topbar/power-menu/power-menu.elements';
import { RebootOrShutdownDialog } from 'app/modules/layout/topbar/reboot-or-shutdown-dialog/reboot-or-shutdown-dialog.component';

@Component({
  selector: 'ix-power-menu',
  templateUrl: './power-menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnIconButtonComponent,
    TnMenuComponent,
    TnMenuItemComponent,
    TnMenuTriggerDirective,
    TranslateModule,
    UiSearchDirective,
  ],
})
export class PowerMenuComponent {
  private tnDialog = inject(TnDialog);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private authService = inject(AuthService);

  protected readonly tooltips = helptextTopbar.tooltips;
  private readonly requiredRoles = [Role.FullAdmin];
  protected readonly hasRequiredRoles = toSignal(this.authService.hasRole(this.requiredRoles), { initialValue: false });
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
