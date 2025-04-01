import {
  ChangeDetectionStrategy, Component, input,
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
import { UsersStore } from 'app/pages/credentials/new-users/store/users.store';
import { UserFormComponent } from 'app/pages/credentials/users/user-form/user-form.component';

@UntilDestroy()
@Component({
  selector: 'ix-user-detail-header',
  templateUrl: './user-detail-header.component.html',
  styleUrls: ['./user-detail-header.component.scss'],
  standalone: true,
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

  protected readonly Role = Role;
  loggedInUser = toSignal(this.authService.user$.pipe(filter(Boolean)));

  constructor(
    private usersStore: UsersStore,
    private authService: AuthService,
    private slideIn: SlideIn,
    private matDialog: MatDialog,
  ) {}

  doEdit(): void {
    this.slideIn.open(UserFormComponent, { wide: true, data: this.user() }).pipe(
      filter((result) => !!result.response),
      untilDestroyed(this),
    ).subscribe(({ response }) => {
      this.usersStore.userUpdated(response);
    });
  }

  doDelete(): void {
    this.matDialog.open(DeleteUserDialog, {
      data: this.user(),
    })
      .afterClosed()
      .pipe(
        filter(Boolean),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.usersStore.initialize();
      });
  }
}
