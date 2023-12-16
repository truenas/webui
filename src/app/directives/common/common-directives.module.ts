import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { AutofocusDirective } from 'app/directives/common/autofocus/autofocus.directive';
import { HasRoleDirective } from 'app/directives/common/has-role/has-role.directive';
import { IfNightlyDirective } from 'app/directives/common/if-nightly/if-nightly.directive';
import { MatButtonRolesDirective } from 'app/directives/common/mat-button-roles/mat-button-roles.directive';
import { StepActivationDirective } from 'app/directives/common/step-activation.directive';
import { LetDirective } from './app-let.directive';

@NgModule({
  imports: [
    CommonModule,
  ],
  declarations: [
    LetDirective,
    IfNightlyDirective,
    HasRoleDirective,
    MatButtonRolesDirective,
    AutofocusDirective,
    StepActivationDirective,
  ],
  exports: [
    LetDirective,
    IfNightlyDirective,
    MatButtonRolesDirective,
    HasRoleDirective,
    AutofocusDirective,
    StepActivationDirective,
  ],
})
export class CommonDirectivesModule { }
