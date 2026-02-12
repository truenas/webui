import { ChangeDetectionStrategy, Component, DestroyRef, output, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatAnchor } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { filter } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { User } from 'app/interfaces/user.interface';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { allUsersHeaderElements } from 'app/pages/credentials/users/all-users/all-users-header/all-users-header.elements';
import { UserFormComponent } from 'app/pages/credentials/users/user-form/user-form.component';

@Component({
  selector: 'ix-all-users-header',
  templateUrl: './all-users-header.component.html',
  styleUrls: ['./all-users-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    TestDirective,
    MatAnchor,
    UiSearchDirective,
    RequiresRolesDirective,
  ],
})
export class AllUsersHeaderComponent {
  private slideIn = inject(SlideIn);
  private destroyRef = inject(DestroyRef);

  protected readonly searchableElements = allUsersHeaderElements;
  protected readonly requiredRoles = [Role.AccountWrite];
  userCreated = output<User>();

  protected doAdd(): void {
    this.slideIn.open(UserFormComponent, { wide: false }).pipe(
      filter(({ response }) => !!response),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: ({ response }) => {
        this.userCreated.emit(response);
      },
    });
  }
}
