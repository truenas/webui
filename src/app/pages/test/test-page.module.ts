import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Page } from '../../core/classes/page';
import { routing } from './test.routing';

import { TestPage } from './page/test-page.component';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [/*Page,*/ TestPage]
})
export class TestPageModule { }
