import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TnButtonComponent } from '@truenas/ui-components';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { allUsersHeaderElements } from 'app/pages/credentials/users/all-users/all-users-header/all-users-header.elements';

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
  protected readonly searchableElements = allUsersHeaderElements;
  protected readonly requiredRoles = [Role.AccountWrite];

  /** Emitted when Add is clicked; the parent opens the user form in a `<tn-side-panel>`. */
  readonly addUser = output();

  protected doAdd(): void {
    this.addUser.emit();
  }
}
