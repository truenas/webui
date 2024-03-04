import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FlexModule } from '@ngbracket/ngx-layout';
import { TranslateModule } from '@ngx-translate/core';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { BreadcrumbComponent } from 'app/modules/page-header/breadcrumb/breadcrumb.component';
import {
  DefaultPageHeaderComponent,
} from 'app/modules/page-header/default-page-header/default-page-header.component';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
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
    PageHeaderComponent,
    NewPageBadgeComponent,
    DefaultPageHeaderComponent,
  ],
  exports: [
    PageHeaderComponent,
    DefaultPageHeaderComponent,
  ],
})
export class PageHeaderModule {}
