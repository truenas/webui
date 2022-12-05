import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { IfNightlyDirective } from 'app/directives/common/if-nightly.directive.ts/if-nightly.directive';
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
  ],
  exports: [
    LazyViewerDirective,
    IxAutoDirective,
    LetDirective,
    IfNightlyDirective,
  ],
})
export class CommonDirectivesModule { }
