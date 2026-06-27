import { ChangeDetectionStrategy, Component, computed, input, inject } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnCardComponent } from '@truenas/ui-components';
import { getUserType, isEmptyHomeDirectory } from 'app/helpers/user.helper';
import { User } from 'app/interfaces/user.interface';

@Component({
  selector: 'ix-user-profile-card',
  templateUrl: './user-profile-card.component.html',
  styleUrls: ['./user-profile-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    TranslateModule,
  ],
})
export class UserProfileCardComponent {
  private translate = inject(TranslateService);

  user = input.required<User>();

  protected type = computed(() => this.translate.instant(getUserType(this.user())));

  protected hasHomeDirectory = computed(() => {
    return !isEmptyHomeDirectory(this.user().home);
  });
}
