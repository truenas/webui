import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ActionHasRoleWrapperComponent } from 'app/directives/common/action-has-role/action-has-role-wrapper.component';
import { ActionHasRoleDirective } from 'app/directives/common/action-has-role/action-has-role.directive';
import { AutofocusDirective } from 'app/directives/common/autofocus/autofocus.directive';
import { HasRoleDirective } from 'app/directives/common/has-role/has-role.directive';
import { IfNightlyDirective } from 'app/directives/common/if-nightly/if-nightly.directive';
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
    ActionHasRoleDirective,
    ActionHasRoleWrapperComponent,
    AutofocusDirective,
    StepActivationDirective,
  ],
  exports: [
    LetDirective,
    IfNightlyDirective,
    HasRoleDirective,
    ActionHasRoleDirective,
    AutofocusDirective,
    StepActivationDirective,
  ],
})
export class CommonDirectivesModule { }
