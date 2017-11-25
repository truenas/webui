import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CoreModule } from '../../core/core.module';
//import { Page } from '../../core/classes/page';
import { routing } from './test.routing';

import { TestPage } from './page/test-page.component';

@NgModule({
  imports: [
    CommonModule,
    routing,
    CoreModule
  ],
  declarations: [TestPage]
})
export class TestPageModule { }
