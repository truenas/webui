import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import {
  ModalHeader2Component,
} from 'app/modules/slide-ins/components/modal-header2/modal-header2.component';
import { TestDirective } from 'app/modules/test-id/test.directive';

@Component({
  selector: 'ix-global-config-form',
  templateUrl: './global-config-form.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormActionsComponent,
    ModalHeader2Component,
    MatButton,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    RequiresRolesDirective,
    TestDirective,
    TranslateModule,
  ],
})
export class GlobalConfigFormComponent {
  protected readonly requiredRoles = [Role.VirtGlobalWrite];
}
