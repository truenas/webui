import { ChangeDetectionStrategy, Component, computed, DestroyRef, input, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnButtonComponent, TnTooltipDirective } from '@truenas/ui-components';
import { filter } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { getDirectoryServiceTooltip } from 'app/helpers/user.helper';
import { User } from 'app/interfaces/user.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { DeleteUserDialog } from 'app/pages/credentials/users/all-users/user-details/delete-user-dialog/delete-user-dialog.component';
import { UserFormComponent } from 'app/pages/credentials/users/user-form/user-form.component';

@Component({
  selector: 'ix-user-detail-header',
  templateUrl: './user-detail-header.component.html',
  styleUrls: ['./user-detail-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnButtonComponent,
    TnTooltipDirective,
    TranslateModule,
    RequiresRolesDirective,
  ],
})
export class UserDetailHeaderComponent {
  private authService = inject(AuthService);
  private slideIn = inject(SlideIn);
  private matDialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);
  private translate = inject(TranslateService);

  user = input.required<User>();

  protected readonly Role = Role;
  protected loggedInUser = toSignal(this.authService.user$.pipe(filter(Boolean)));

  protected readonly directoryServiceTooltip = computed(() => {
    return getDirectoryServiceTooltip(this.user(), this.translate);
  });

  protected doEdit(): void {
    if (!this.user().local) return;
    this.slideIn.open(UserFormComponent, { data: this.user() });
  }

  protected doDelete(): void {
    if (!this.user().local) return;
    this.matDialog
      .open(DeleteUserDialog, { data: this.user() })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }
}
