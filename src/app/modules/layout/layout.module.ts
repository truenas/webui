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
import { TranslateModule } from '@ngx-translate/core';
import { CommonDirectivesModule } from 'app/directives/common-directives.module';
import { AlertsModule } from 'app/modules/alerts/alerts.module';

import { GlobalSearchModule } from 'app/modules/global-search/global-search.module';
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
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
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
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxSlideInComponent } from 'app/modules/forms/ix-forms/components/ix-slide-in/ix-slide-in.component';
import {
  IxChainedSlideInComponent
} from 'app/modules/forms/ix-forms/components/ix-slide-in/components/ix-chained-slide-in/ix-chained-slide-in.component';

@NgModule({
  imports: [
    CommonModule,
    TranslateModule,
    IxIconModule,
    ReactiveFormsModule,
    MatButtonModule,
    RouterModule,
    CommonDirectivesModule,
    MatTooltipModule,
    MatDividerModule,
    MatListModule,
    MatDialogModule,
    MatSidenavModule,
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
    MapValuePipe,
    IxInputComponent,
    FormActionsComponent,
    IxSlideInComponent,
    IxChainedSlideInComponent,
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
