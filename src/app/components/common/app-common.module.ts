import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { FlexLayoutModule } from '@angular/flex-layout';
import { TranslateModule } from 'ng2-translate/ng2-translate';
import { 
  MdSidenavModule,
  MdListModule,
  MdTooltipModule,
  MdOptionModule,
  MdSelectModule,
  MdMenuModule,
  MdSnackBarModule,
  MdGridListModule,
  MdToolbarModule,
  MdIconModule,
  MdButtonModule,
  MdRadioModule,
  MdCheckboxModule,
  MdCardModule,
  MdDialogModule
} from '@angular/material';

import {ChartistModule} from 'ng-chartist';
import { TopbarComponent } from './topbar/topbar.component';
import { NavigationComponent } from './navigation/navigation.component';
import { NotificationsComponent } from './notifications/notifications.component';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { CommonDirectivesModule } from '../../directives/common/common-directives.module';
import { ThemeService } from '../../services/theme/theme.service';
import { DialogService } from '../../services/dialog.service';
import { CustomizerComponent } from './customizer/customizer.component';
import { BreadcrumbComponent } from './breadcrumb/breadcrumb.component';
import { LineChartComponent } from './lineChart';
import { LineChartService } from './lineChart/lineChart.service';
import { TestPageModule } from 'app/pages/test/test-page.module';
import { CoreModule } from 'app/core/core.module';
import { Page } from 'app/core/components/page/page.component';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    FlexLayoutModule,
    MdSidenavModule,
    MdIconModule,
    MdListModule,
    MdTooltipModule,
    MdOptionModule,
    MdSelectModule,
    MdMenuModule,
    MdSnackBarModule,
    MdGridListModule,
    MdToolbarModule,
    MdButtonModule,
    MdRadioModule,
    MdCheckboxModule,
    MdCardModule,
    MdDialogModule,
    CommonDirectivesModule,
    TranslateModule,
    ChartistModule,
    CoreModule,
    TestPageModule
  ],
  declarations: [
    AdminLayoutComponent,
    AuthLayoutComponent,
    TopbarComponent, 
    NavigationComponent, 
    NotificationsComponent, CustomizerComponent, BreadcrumbComponent, LineChartComponent 
  ],
  providers: [ThemeService, DialogService, LineChartService],
  exports: [LineChartComponent]
})
export class AppCommonModule {}