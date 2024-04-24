import {
  AsyncPipe, NgComponentOutlet, NgForOf, NgIf,
} from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButton, MatButtonModule } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { BaseChartDirective } from 'ng2-charts';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { IxDropGridModule } from 'app/modules/ix-drop-grid/ix-drop-grid.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { LayoutModule } from 'app/modules/layout/layout.module';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { PageHeaderModule } from 'app/modules/page-header/page-header.module';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { DashboardComponent } from 'app/pages/dashboard/components/dashboard/dashboard.component';
import {
  WidgetGroupControlsComponent,
} from 'app/pages/dashboard/components/dashboard/widget-group-controls/widget-group-controls.component';
import { WidgetErrorComponent } from 'app/pages/dashboard/components/widget-error/widget-error.component';
import { WidgetGroupComponent } from 'app/pages/dashboard/components/widget-group/widget-group.component';
import {
  WidgetEditorGroupComponent,
} from 'app/pages/dashboard/components/widget-group-form/widget-editor-group/widget-editor-group.component';
import { WidgetGroupFormComponent } from 'app/pages/dashboard/components/widget-group-form/widget-group-form.component';
import { routing } from 'app/pages/dashboard/dashboard.routing';
import { DashboardStore } from 'app/pages/dashboard/services/dashboard.store';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { widgetComponents } from 'app/pages/dashboard/widgets/all-widgets.constant';

@NgModule({
  imports: [
    IxFormsModule,
    ReactiveFormsModule,
    TranslateModule,
    AppLoaderModule,
    NgComponentOutlet,
    CommonDirectivesModule,
    LayoutModule,
    MatButton,
    TestIdModule,
    TranslateModule,
    PageHeaderModule,
    routing,
    MatCard,
    IxIconModule,
    NgIf,
    NgForOf,
    AsyncPipe,
    MatTooltipModule,
    BaseChartDirective,
    MatButtonModule,
    MatCardContent,
    NgxSkeletonLoaderModule.forRoot({
      animation: false,
      theme: {
        extendsFromRoot: true,
        'margin-bottom': 0,
        background: 'var(--alt-bg1)',
        opacity: '0.25',
      },
    }),
    IxDropGridModule,
  ],
  declarations: [
    DashboardComponent,
    WidgetGroupComponent,
    WidgetErrorComponent,
    WidgetGroupFormComponent,
    WidgetEditorGroupComponent,
    WidgetGroupControlsComponent,
    ...widgetComponents,
  ],
  providers: [
    DashboardStore,
    WidgetResourcesService,
  ],
})
export class DashboardModule {
}
