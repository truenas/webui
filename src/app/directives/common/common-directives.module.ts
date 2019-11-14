import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EqualValidatorDirective } from './equal-validator.directive';
import { SideNavAccordionDirective } from './sidenav-accordion.directive';
import { AppAccordionDirective } from './app-accordion.directive';
import { FontSizeDirective } from './font-size.directive';
import { LazyViewerDirective } from './lazy-viewer/lazy-viewer.directive';
import { IXAutoDirective } from './ix-auto.directive';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    EqualValidatorDirective,
    SideNavAccordionDirective,
    AppAccordionDirective,
    FontSizeDirective,
    LazyViewerDirective, 
    IXAutoDirective
  ],
  exports: [
    EqualValidatorDirective,
    SideNavAccordionDirective,
    AppAccordionDirective,
    FontSizeDirective,
    LazyViewerDirective,
    IXAutoDirective
  ]
})
export class CommonDirectivesModule { }
