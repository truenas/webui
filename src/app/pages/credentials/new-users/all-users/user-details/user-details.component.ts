import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { User } from 'app/interfaces/user.interface';
import { UserAccessCardComponent } from 'app/pages/credentials/new-users/all-users/user-details/user-access-card/user-access-card.component';
import { userDetailsElements } from 'app/pages/credentials/new-users/all-users/user-details/user-details.elements';
import { UserProfileCardComponent } from 'app/pages/credentials/new-users/all-users/user-details/user-profile-card/user-profile-card.component';

@Component({
  selector: 'ix-user-details',
  templateUrl: './user-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    UserProfileCardComponent,
    UserAccessCardComponent,
    UiSearchDirective,
  ],
})
export class UserDetailsComponent {
  user = input.required<User>();

  protected readonly searchableElements = userDetailsElements;
}
