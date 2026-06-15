import { ChangeDetectionStrategy, Component, DestroyRef, output, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TnButtonComponent } from '@truenas/ui-components';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { User } from 'app/interfaces/user.interface';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { allUsersHeaderElements } from 'app/pages/credentials/users/all-users/all-users-header/all-users-header.elements';
import { UserFormComponent } from 'app/pages/credentials/users/user-form/user-form.component';

@Component({
  selector: 'ix-all-users-header',
  templateUrl: './all-users-header.component.html',
  styleUrls: ['./all-users-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    TnButtonComponent,
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
    this.slideIn.open(UserFormComponent, { wide: false }).onSuccess((response) => {
      this.userCreated.emit(response);
    }, this.destroyRef);
  }
}
