import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexModule } from '@angular/flex-layout';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { BreadcrumbComponent } from 'app/modules/page-header/breadcrumb/breadcrumb.component';
import { PageTitleHeaderComponent } from 'app/modules/page-header/page-title-header/page-title-header.component';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { IsNewIndicatorComponent } from './is-new-indicator/is-new-indicator.component';

@NgModule({
  imports: [
    CommonModule,
    FlexModule,
    RouterModule,
    TranslateModule,
    CommonDirectivesModule,
    TestIdModule,
  ],
  declarations: [
    BreadcrumbComponent,
    PageTitleHeaderComponent,
    IsNewIndicatorComponent,
  ],
  exports: [
    PageTitleHeaderComponent,
  ],
})
export class PageHeaderModule {}
