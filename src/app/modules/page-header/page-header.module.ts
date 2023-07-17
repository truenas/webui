import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexModule } from '@angular/flex-layout';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { BreadcrumbComponent } from 'app/modules/page-header/breadcrumb/breadcrumb.component';
import { PageTitleHeaderComponent } from 'app/modules/page-header/page-title-header/page-title-header.component';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { NewPageBadgeComponent } from './is-new-indicator/new-page-badge.component';

@NgModule({
  imports: [
    CommonModule,
    FlexModule,
    RouterModule,
    TranslateModule,
    CommonDirectivesModule,
    TestIdModule,
    AppLoaderModule,
  ],
  declarations: [
    BreadcrumbComponent,
    PageTitleHeaderComponent,
    NewPageBadgeComponent,
  ],
  exports: [
    PageTitleHeaderComponent,
  ],
})
export class PageHeaderModule {}
