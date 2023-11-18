import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { AutofocusDirective } from 'app/directives/common/autofocus/autofocus.directive';
import { IfNightlyDirective } from 'app/directives/common/if-nightly/if-nightly.directive';
import { IfUserHasRolesDirective } from 'app/directives/common/if-user-has-roles/if-user-has-roles.directive';
import { StepActivationDirective } from 'app/directives/common/step-activation.directive';
import { LetDirective } from './app-let.directive';

@NgModule({
  imports: [
    CommonModule,
  ],
  declarations: [
    LetDirective,
    IfNightlyDirective,
    IfUserHasRolesDirective,
    AutofocusDirective,
    StepActivationDirective,
  ],
  exports: [
    LetDirective,
    IfNightlyDirective,
    IfUserHasRolesDirective,
    AutofocusDirective,
    StepActivationDirective,
  ],
})
export class CommonDirectivesModule { }
