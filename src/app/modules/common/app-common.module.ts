import { PortalModule } from '@angular/cdk/portal';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule } from '@angular/forms';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule, SvgIconRegistryService } from 'angular-svg-icon';
import { ChartistModule } from 'ng-chartist';
import { ViewControllerComponent } from 'app/core/components/view-controller/view-controller.component';
import { CoreComponents } from 'app/core/core-components.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { AlertsModule } from 'app/modules/alerts/alerts.module';
import { CastModule } from 'app/modules/cast/cast.module';
import { BreadcrumbComponent } from 'app/modules/common/breadcrumb/breadcrumb.component';
import { AboutDialogComponent } from 'app/modules/common/dialog/about/about-dialog.component';
import { ConfirmDialogComponent } from 'app/modules/common/dialog/confirm-dialog/confirm-dialog.component';
import { ConsolePanelDialogComponent } from 'app/modules/common/dialog/console-panel/console-panel-dialog.component';
import { DirectoryServicesMonitorComponent } from 'app/modules/common/dialog/directory-services-monitor/directory-services-monitor.component';
import { ErrorDialogComponent } from 'app/modules/common/dialog/error-dialog/error-dialog.component';
import { GeneralDialogComponent } from 'app/modules/common/dialog/general-dialog/general-dialog.component';
import { InfoDialogComponent } from 'app/modules/common/dialog/info-dialog/info-dialog.component';
import { ResilverProgressDialogComponent } from 'app/modules/common/dialog/resilver-progress/resilver-progress.component';
import { SelectDialogComponent } from 'app/modules/common/dialog/select-dialog/select-dialog.component';
import { AdminLayoutComponent } from 'app/modules/common/layouts/admin-layout/admin-layout.component';
import { AuthLayoutComponent } from 'app/modules/common/layouts/auth-layout/auth-layout.component';
import { ModalComponent } from 'app/modules/common/modal/modal.component';
import { NavigationComponent } from 'app/modules/common/navigation/navigation.component';
import { HeaderInputWrapperComponent } from 'app/modules/common/page-header-actions-wrapper/header-input-wrapper.component';
import { HeaderInputDirective } from 'app/modules/common/page-header-actions-wrapper/header-input.directive';
import { PageTitleHeaderComponent } from 'app/modules/common/page-title-header/page-title-header.component';
import { PageTitleComponent } from 'app/modules/common/page-title/page-title.component';
import { SecondaryMenuComponent } from 'app/modules/common/secondary-menu/secondary-menu.component';
import { TopbarComponent } from 'app/modules/common/topbar/topbar.component';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { JobsModule } from 'app/modules/jobs/jobs.module';
import { LayoutModule } from 'app/modules/layout/layout.module';
import { TooltipModule } from 'app/modules/tooltip/tooltip.module';
import { TruecommandModule } from 'app/modules/truecommand/truecommand.module';
import { DialogService, LanguageService } from 'app/services';
import { LocaleService } from 'app/services/locale.service';
import { ThemeService } from 'app/services/theme/theme.service';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    FlexLayoutModule,
    CommonDirectivesModule,
    TranslateModule,
    PortalModule,
    IxFormsModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    MatBadgeModule,
    MatToolbarModule,
    MatListModule,
    MatButtonModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatSidenavModule,
    MatProgressBarModule,
    MatTableModule,
    MatDialogModule,
    MatCheckboxModule,
    MatIconModule,
    TooltipModule,
    MatSelectModule,
    ChartistModule,
    HttpClientModule,
    EntityModule,
    CoreComponents,
    ScrollingModule,
    AngularSvgIconModule.forRoot(),
    CastModule,
    AlertsModule,
    TruecommandModule,
    JobsModule,
    LayoutModule,
  ],
  declarations: [
    AdminLayoutComponent,
    AuthLayoutComponent,
    TopbarComponent,
    ResilverProgressDialogComponent,
    ConfirmDialogComponent,
    InfoDialogComponent,
    SelectDialogComponent,
    GeneralDialogComponent,
    ErrorDialogComponent,
    AboutDialogComponent,
    NavigationComponent,
    PageTitleHeaderComponent,
    HeaderInputWrapperComponent,
    HeaderInputDirective,
    ConsolePanelDialogComponent,
    DirectoryServicesMonitorComponent,
    ModalComponent,
    BreadcrumbComponent,
    PageTitleComponent,
    SecondaryMenuComponent,
  ],
  providers: [ThemeService, DialogService, LanguageService, LocaleService, SvgIconRegistryService],
  exports: [
    PageTitleComponent,
    PageTitleHeaderComponent,
    ViewControllerComponent,
    HeaderInputDirective,
  ],
})
export class AppCommonModule {}
