import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EqualValidatorDirective } from './equal-validator.directive';
import { SideNavAccordionDirective } from './sidenav-accordion.directive';
import { AppAccordionDirective } from './app-accordion.directive';
import { FontSizeDirective } from './font-size.directive';
import { LazyViewerDirective } from './lazy-viewer/lazy-viewer.directive';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    EqualValidatorDirective,
    SideNavAccordionDirective,
    AppAccordionDirective,
    FontSizeDirective,
    LazyViewerDirective
  ],
  exports: [
    EqualValidatorDirective,
    SideNavAccordionDirective,
    AppAccordionDirective,
    FontSizeDirective,
    LazyViewerDirective
  ]
})
export class CommonDirectivesModule { }
