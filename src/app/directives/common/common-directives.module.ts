import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
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
  ],
  exports: [
    LazyViewerDirective,
    IxAutoDirective,
    LetDirective,
  ],
})
export class CommonDirectivesModule { }
