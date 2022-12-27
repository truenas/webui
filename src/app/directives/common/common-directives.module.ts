import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { AutofocusDirective } from 'app/directives/common/autofocus/autofocus.directive';
import { IfNightlyDirective } from 'app/directives/common/if-nightly/if-nightly.directive';
import { LetDirective } from './app-let.directive';
import { IxAutoDirective } from './ix-auto.directive';
import { LazyViewerDirective } from './lazy-viewer/lazy-viewer.directive';

@NgModule({
  imports: [
    CommonModule,
  ],
  declarations: [
    LazyViewerDirective,
    IxAutoDirective,
    LetDirective,
    IfNightlyDirective,
    AutofocusDirective,
  ],
  exports: [
    LazyViewerDirective,
    IxAutoDirective,
    LetDirective,
    IfNightlyDirective,
    AutofocusDirective,
  ],
})
export class CommonDirectivesModule { }
