import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { AutofocusDirective } from 'app/directives/common/autofocus/autofocus.directive';
import { IfNightlyDirective } from 'app/directives/common/if-nightly/if-nightly.directive';
import { LetDirective } from './app-let.directive';
import { LazyViewerDirective } from './lazy-viewer/lazy-viewer.directive';

@NgModule({
  imports: [
    CommonModule,
  ],
  declarations: [
    LazyViewerDirective,
    LetDirective,
    IfNightlyDirective,
    AutofocusDirective,
  ],
  exports: [
    LazyViewerDirective,
    LetDirective,
    IfNightlyDirective,
    AutofocusDirective,
  ],
})
export class CommonDirectivesModule { }
