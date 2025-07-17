import {
  ChangeDetectionStrategy, Component, input, output,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { filter } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { User } from 'app/interfaces/user.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { DeleteUserDialog } from 'app/pages/credentials/new-users/all-users/user-details/delete-user-dialog/delete-user-dialog.component';
import { UserFormComponent } from 'app/pages/credentials/new-users/user-form/user-form.component';

@UntilDestroy()
@Component({
  selector: 'ix-user-detail-header',
  templateUrl: './user-detail-header.component.html',
  styleUrls: ['./user-detail-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButton,
    TranslateModule,
    RequiresRolesDirective,
    TestDirective,
  ],
})
export class UserDetailHeaderComponent {
  user = input.required<User>();
  reloadUsers = output();

  protected readonly Role = Role;
  protected loggedInUser = toSignal(this.authService.user$.pipe(filter(Boolean)));

  constructor(
    private authService: AuthService,
    private slideIn: SlideIn,
    private matDialog: MatDialog,
  ) {}

  protected doEdit(): void {
    this.slideIn
      .open(UserFormComponent, { data: this.user() })
      .pipe(untilDestroyed(this))
      .subscribe((result) => {
        if (result?.response) {
          this.reloadUsers.emit();
        }
      });
  }

  protected doDelete(): void {
    this.matDialog
      .open(DeleteUserDialog, { data: this.user() })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe();
  }
}
