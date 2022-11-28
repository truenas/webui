import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexModule } from '@angular/flex-layout';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { BreadcrumbComponent } from 'app/modules/page-header/breadcrumb/breadcrumb.component';
import { PageTitleHeaderComponent } from 'app/modules/page-header/page-title-header/page-title-header.component';

@NgModule({
  imports: [
    CommonModule,
    FlexModule,
    RouterModule,
    TranslateModule,
    CommonDirectivesModule,
  ],
  declarations: [
    BreadcrumbComponent,
    PageTitleHeaderComponent,
  ],
  exports: [
    PageTitleHeaderComponent,
  ],
})
export class PageHeaderModule {}
