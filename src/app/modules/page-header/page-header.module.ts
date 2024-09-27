import { AsyncPipe } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { IfNightlyDirective } from 'app/directives/if-nightly/if-nightly.directive';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { BreadcrumbComponent } from 'app/modules/page-header/breadcrumb/breadcrumb.component';
import {
  DefaultPageHeaderComponent,
} from 'app/modules/page-header/default-page-header/default-page-header.component';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { NewPageBadgeComponent } from './is-new-indicator/new-page-badge.component';

@NgModule({
  imports: [
    RouterModule,
    TranslateModule,
    MatButton,
    AsyncPipe,
    IfNightlyDirective,
    FakeProgressBarComponent,
    TestDirective,
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
