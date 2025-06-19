import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import {
  MatCard, MatCardContent, MatCardHeader,
  MatCardTitle,
} from '@angular/material/card';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { getUserType, isEmptyHomeDirectory } from 'app/helpers/user.helper';
import { User } from 'app/interfaces/user.interface';

@UntilDestroy()
@Component({
  selector: 'ix-user-profile-card',
  templateUrl: './user-profile-card.component.html',
  styleUrls: ['./user-profile-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCard,
    MatCardTitle,
    MatCardHeader,
    MatCardContent,
    TranslateModule,
  ],
})
export class UserProfileCardComponent {
  user = input.required<User>();

  constructor(
    private translate: TranslateService,
  ) {}

  protected type = computed(() => this.translate.instant(getUserType(this.user())));

  protected hasHomeDirectory = computed(() => {
    return !isEmptyHomeDirectory(this.user().home);
  });
}
