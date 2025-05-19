import {
  ChangeDetectionStrategy, Component,
  computed,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { AppState } from 'app/store';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-update-profile-card',
  styleUrls: ['update-profile-card.component.scss'],
  templateUrl: './update-profile-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    IxSelectComponent,
    TestDirective,
    MatButtonModule,
    TranslateModule,
  ],
})
export class UpdateProfileCard {
  protected readonly isEnterprise = toSignal(this.store$.select(selectIsEnterprise));

  protected updateProfileControl = new FormControl('general');

  readonly enterpriseUpdateProfiles = [
    {
      name: 'General',
      note: 'not recommended',
      description: 'Field tested software with mature features. Few issues are expected.',
      id: 'general',
    },
    {
      name: 'Conservative',
      note: 'Default',
      description: 'Mature software with well documented limitations. Software updates are infrequent.',
      id: 'conservative',
    },
    {
      name: 'Mission Critical',
      description: 'Mature software that enables 24 x 7 operations with high availability for a very clearly defined use case. Software updates are very infrequent and based on need.',
      id: 'mission_critical',
    },
  ];

  readonly communityEditionUpdateProfiles = [
    {
      name: 'Developer',
      description: 'Latest software with new features and bugs alike. There is an opportunity to contribute directly to the development process.',
      id: 'developer',
    },
    {
      name: 'Tester',
      description: 'New software with recent features. Some bugs are expected and there is a willingness to provide bug reports and feedback to the developers.',
      id: 'tester',
    },
    {
      name: 'Early Adopter',
      description: 'Released software with new features. Data is protected, but some issues may need workarounds or patience.',
      id: 'early_adopter',
    },
    {
      name: 'General',
      note: 'default',
      description: 'Field tested software with mature features. Few issues are expected.',
      id: 'general',
    },
  ];

  profiles = computed(() => {
    if (this.isEnterprise()) {
      return this.enterpriseUpdateProfiles;
    }

    return this.communityEditionUpdateProfiles;
  });

  profileOptions = computed(() => {
    return of(
      this.profiles().map((profile) => ({
        label: profile.name,
        value: profile.id,
      })),
    );
  });

  constructor(
    private store$: Store<AppState>,
  ) { }
}
