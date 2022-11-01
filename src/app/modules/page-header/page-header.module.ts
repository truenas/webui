import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexModule } from '@angular/flex-layout';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { PageTitleHeaderComponent } from 'app/modules/page-header/page-title-header/page-title-header.component';

@NgModule({
  imports: [
    CommonModule,
    FlexModule,
    RouterModule,
    TranslateModule,
  ],
  declarations: [
    PageTitleHeaderComponent,
  ],
  exports: [
    PageTitleHeaderComponent,
  ],
})
export class PageHeaderModule {}
