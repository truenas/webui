import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { AutofocusDirective } from 'app/directives/common/autofocus/autofocus.directive';
import { IfNightlyDirective } from 'app/directives/common/if-nightly/if-nightly.directive';
import { LetDirective } from './app-let.directive';

@NgModule({
  imports: [
    CommonModule,
  ],
  declarations: [
    LetDirective,
    IfNightlyDirective,
    AutofocusDirective,
  ],
  exports: [
    LetDirective,
    IfNightlyDirective,
    AutofocusDirective,
  ],
})
export class CommonDirectivesModule { }
