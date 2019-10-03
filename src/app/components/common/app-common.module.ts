import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { FlexLayoutModule } from '@angular/flex-layout';
import { TranslateModule } from '@ngx-translate/core';
import { MaterialModule } from '../../appMaterial.module';

import { ChartistModule } from 'ng-chartist';
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
//import { LineChartComponent } from './lineChart';
//import { LineChartService } from './lineChart/lineChart.service';
import { LanguageService } from '../../services/language.service';
import { HttpClientModule } from '@angular/common/http';
import { LocaleService } from '../../services/locale.service';

import { AngularSvgIconModule } from 'angular-svg-icon';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    FlexLayoutModule,
    MaterialModule,
    CommonDirectivesModule,
    TranslateModule,
    ChartistModule,
    HttpClientModule,
    AngularSvgIconModule
  ],
  declarations: [
    AdminLayoutComponent,
    AuthLayoutComponent,
    TopbarComponent,
    NavigationComponent,
    NotificationsComponent, CustomizerComponent, BreadcrumbComponent, //LineChartComponent
  ],
  providers: [ThemeService, DialogService, /*LineChartService,*/ LanguageService, LocaleService],
  exports: [/*LineChartComponent*/]
})
export class AppCommonModule {}
