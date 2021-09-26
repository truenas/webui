import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { AppAccordionDirective } from './app-accordion.directive';
import { LetDirective } from './app-let.directive';
import { EqualValidatorDirective } from './equal-validator.directive';
import { IXAutoDirective } from './ix-auto.directive';
import { LazyViewerDirective } from './lazy-viewer/lazy-viewer.directive';

@NgModule({
  imports: [
    CommonModule,
  ],
  declarations: [
    EqualValidatorDirective,
    AppAccordionDirective,
    LazyViewerDirective,
    IXAutoDirective,
    LetDirective,
  ],
  exports: [
    EqualValidatorDirective,
    AppAccordionDirective,
    LazyViewerDirective,
    IXAutoDirective,
    LetDirective,
  ],
})
export class CommonDirectivesModule { }
