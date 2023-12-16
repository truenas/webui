import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ActionHasRoleWrapperComponent } from 'app/directives/common/action-has-role/action-has-role-wrapper.component';
import { ActionHasRoleDirective } from 'app/directives/common/action-has-role/action-has-role.directive';
import { AutofocusDirective } from 'app/directives/common/autofocus/autofocus.directive';
import { HasRoleDirective } from 'app/directives/common/has-role/has-role.directive';
import { IfNightlyDirective } from 'app/directives/common/if-nightly/if-nightly.directive';
import { RequiresRoleDirective } from 'app/directives/common/requires-role/requires-role.directive';
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
    RequiresRoleDirective,
    ActionHasRoleWrapperComponent,
    AutofocusDirective,
    StepActivationDirective,
  ],
  exports: [
    LetDirective,
    IfNightlyDirective,
    RequiresRoleDirective,
    HasRoleDirective,
    ActionHasRoleDirective,
    AutofocusDirective,
    StepActivationDirective,
  ],
})
export class CommonDirectivesModule { }
