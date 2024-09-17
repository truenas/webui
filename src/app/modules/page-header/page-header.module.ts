import { AsyncPipe } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { IfNightlyDirective } from 'app/directives/if-nightly/if-nightly.directive';
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
    RouterModule,
    TranslateModule,
    TestIdModule,
    AppLoaderModule,
    MatButton,
    AsyncPipe,
    IfNightlyDirective,
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
