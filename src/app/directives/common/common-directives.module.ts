import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { AutofocusDirective } from 'app/directives/common/autofocus/autofocus.directive';
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
    AutofocusDirective,
    StepActivationDirective,
  ],
  exports: [
    LetDirective,
    IfNightlyDirective,
    AutofocusDirective,
    StepActivationDirective,
  ],
})
export class CommonDirectivesModule { }
