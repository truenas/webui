import {
  ChangeDetectionStrategy, Component, input,
  output,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { User } from 'app/interfaces/user.interface';
import { UserAccessCardComponent } from 'app/pages/credentials/users/all-users/user-details/user-access-card/user-access-card.component';
import { userDetailsElements } from 'app/pages/credentials/users/all-users/user-details/user-details.elements';
import { UserPasswordCardComponent } from 'app/pages/credentials/users/all-users/user-details/user-password-card/user-password-card.component';
import { UserProfileCardComponent } from 'app/pages/credentials/users/all-users/user-details/user-profile-card/user-profile-card.component';

@Component({
  selector: 'ix-user-details',
  templateUrl: './user-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    UserProfileCardComponent,
    UserAccessCardComponent,
    UserPasswordCardComponent,
    UiSearchDirective,
  ],
})
export class UserDetailsComponent {
  user = input.required<User>();
  reloadUsers = output();

  protected readonly searchableElements = userDetailsElements;
}
