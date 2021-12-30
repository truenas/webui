import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { AppAccordionDirective } from './app-accordion.directive';
import { LetDirective } from './app-let.directive';
import { EqualValidatorDirective } from './equal-validator.directive';
import { IxAutoDirective } from './ix-auto.directive';
import { LazyViewerDirective } from './lazy-viewer/lazy-viewer.directive';

@NgModule({
  imports: [
    CommonModule,
  ],
  declarations: [
    EqualValidatorDirective,
    AppAccordionDirective,
    LazyViewerDirective,
    IxAutoDirective,
    LetDirective,
  ],
  exports: [
    EqualValidatorDirective,
    AppAccordionDirective,
    LazyViewerDirective,
    IxAutoDirective,
    LetDirective,
  ],
})
export class CommonDirectivesModule { }
