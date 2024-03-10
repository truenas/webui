import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { FlexModule } from '@ngbracket/ngx-layout';
import { TranslateModule } from '@ngx-translate/core';
import { CoreComponents } from 'app/core/core-components.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { AlertsModule } from 'app/modules/alerts/alerts.module';
import { GlobalSearchModule } from 'app/modules/global-search/global-search.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { AdminLayoutComponent } from 'app/modules/layout/components/admin-layout/admin-layout.component';
import { AuthLayoutComponent } from 'app/modules/layout/components/auth-layout/auth-layout.component';
import { ConsoleFooterComponent } from 'app/modules/layout/components/console-footer/console-footer.component';
import {
  ConsolePanelDialogComponent,
} from 'app/modules/layout/components/console-footer/console-panel/console-panel-dialog.component';
import { CopyrightLineComponent } from 'app/modules/layout/components/copyright-line/copyright-line.component';
import { NavigationComponent } from 'app/modules/layout/components/navigation/navigation.component';
import { SecondaryMenuComponent } from 'app/modules/layout/components/secondary-menu/secondary-menu.component';
import { AboutDialogComponent } from 'app/modules/layout/components/topbar/about-dialog/about-dialog.component';
import {
  ChangePasswordDialogComponent,
} from 'app/modules/layout/components/topbar/change-password-dialog/change-password-dialog.component';
import { DirectoryServicesIndicatorComponent } from 'app/modules/layout/components/topbar/directory-services-indicator/directory-services-indicator.component';
import {
  DirectoryServicesMonitorComponent,
} from 'app/modules/layout/components/topbar/directory-services-indicator/directory-services-monitor/directory-services-monitor.component';
import {
  ResilverProgressDialogComponent,
} from 'app/modules/layout/components/topbar/resilvering-indicator/resilver-progress/resilver-progress.component';
import { TopbarComponent } from 'app/modules/layout/components/topbar/topbar.component';
import { PageHeaderModule } from 'app/modules/page-header/page-header.module';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { TruecommandModule } from 'app/modules/truecommand/truecommand.module';
import { CheckinIndicatorComponent } from './components/topbar/checkin-indicator/checkin-indicator.component';
import { FailoverUpgradeIndicatorComponent } from './components/topbar/failover-upgrade-indicator/failover-upgrade-indicator.component';
import { HaStatusIconComponent } from './components/topbar/ha-status-icon/ha-status-icon.component';
import { HaStatusPopoverComponent } from './components/topbar/ha-status-icon/ha-status-popover/ha-status-popover.component';
import { IxLogoComponent } from './components/topbar/ix-logo/ix-logo.component';
import { JobsIndicatorComponent } from './components/topbar/jobs-indicator/jobs-indicator.component';
import { PowerMenuComponent } from './components/topbar/power-menu/power-menu.component';
import { ResilveringIndicatorComponent } from './components/topbar/resilvering-indicator/resilvering-indicator.component';
import { UserMenuComponent } from './components/topbar/user-menu/user-menu.component';

@NgModule({
  imports: [
    CommonModule,
    TranslateModule,
    IxFormsModule,
    IxIconModule,
    ReactiveFormsModule,
    MatButtonModule,
    FlexModule,
    RouterModule,
    CommonDirectivesModule,
    MatTooltipModule,
    MatDividerModule,
    MatListModule,
    MatDialogModule,
    MatSidenavModule,
    CoreComponents,
    AlertsModule,
    MatMenuModule,
    MatToolbarModule,
    TruecommandModule,
    MatBadgeModule,
    PageHeaderModule,
    TestIdModule,
    MatProgressBarModule,
    MatTableModule,
    MatProgressSpinnerModule,
    GlobalSearchModule,
  ],
  declarations: [
    ChangePasswordDialogComponent,
    NavigationComponent,
    SecondaryMenuComponent,
    PowerMenuComponent,
    TopbarComponent,
    UserMenuComponent,
    AuthLayoutComponent,
    AdminLayoutComponent,
    CopyrightLineComponent,
    ConsoleFooterComponent,
    DirectoryServicesIndicatorComponent,
    JobsIndicatorComponent,
    IxLogoComponent,
    HaStatusIconComponent,
    HaStatusPopoverComponent,
    ResilveringIndicatorComponent,
    FailoverUpgradeIndicatorComponent,
    CheckinIndicatorComponent,
    AboutDialogComponent,
    ConsolePanelDialogComponent,
    ResilverProgressDialogComponent,
    DirectoryServicesMonitorComponent,
  ],
  exports: [
    ChangePasswordDialogComponent,
    PageHeaderComponent,
    SecondaryMenuComponent,
    NavigationComponent,
    CopyrightLineComponent,
    TopbarComponent,
  ],
})
export class LayoutModule {}
