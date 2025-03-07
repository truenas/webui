import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MatCard, MatCardActions, MatCardContent, MatCardHeader,
  MatCardTitle,
} from '@angular/material/card';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { User } from 'app/interfaces/user.interface';
import { TestDirective } from 'app/modules/test-id/test.directive';

@UntilDestroy()
@Component({
  selector: 'ix-user-general-info',
  templateUrl: './user-general-info.component.html',
  styleUrls: ['./user-general-info.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButton,
    MatCard,
    MatCardTitle,
    MatCardHeader,
    MatCardActions,
    MatCardContent,
    TranslateModule,
    RequiresRolesDirective,
    TestDirective,
  ],
})
export class UserGeneralInfoComponent {
  user = input.required<User>();

  protected readonly Role = Role;
}
