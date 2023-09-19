import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexModule } from '@angular/flex-layout';
import { ReactiveFormsModule } from '@angular/forms';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CoreComponents } from 'app/core/core-components.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { AlertsModule } from 'app/modules/alerts/alerts.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { AdminLayoutComponent } from 'app/modules/layout/components/admin-layout/admin-layout.component';
import { AuthLayoutComponent } from 'app/modules/layout/components/auth-layout/auth-layout.component';
import {
  ChangePasswordDialogComponent,
} from 'app/modules/layout/components/change-password-dialog/change-password-dialog.component';
import { ConsoleFooterComponent } from 'app/modules/layout/components/console-footer/console-footer.component';
import { CopyrightLineComponent } from 'app/modules/layout/components/copyright-line/copyright-line.component';
import { NavigationComponent } from 'app/modules/layout/components/navigation/navigation.component';
import { SecondaryMenuComponent } from 'app/modules/layout/components/secondary-menu/secondary-menu.component';
import { DirectoryServicesIndicatorComponent } from 'app/modules/layout/components/topbar/directory-services-indicator/directory-services-indicator.component';
import { TopbarComponent } from 'app/modules/layout/components/topbar/topbar.component';
import { PageHeaderModule } from 'app/modules/page-header/page-header.module';
import { PageTitleHeaderComponent } from 'app/modules/page-header/page-title-header/page-title-header.component';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { TruecommandModule } from 'app/modules/truecommand/truecommand.module';
import { FailoverUpgradeIndicatorComponent } from './components/topbar/failover-upgrade-indicator/failover-upgrade-indicator.component';
import { HaStatusIconComponent } from './components/topbar/ha-status-icon/ha-status-icon.component';
import { HaStatusPopoverComponent } from './components/topbar/ha-status-icon/ha-status-popover/ha-status-popover.component';
import { IxLogoComponent } from './components/topbar/ix-logo/ix-logo.component';
import { JobsIndicatorComponent } from './components/topbar/jobs-indicator/jobs-indicator.component';
import { PowerMenuComponent } from './components/topbar/power-menu/power-menu.component';
import { ResilveringIndicatorComponent } from './components/topbar/resilvering-indicator/resilvering-indicator.component';
import { UserMenuComponent } from './components/topbar/user-menu/user-menu.component';
import { PageHeaderDirective } from './directives/page-header.directive';

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
    PageHeaderDirective,
    IxLogoComponent,
    HaStatusIconComponent,
    HaStatusPopoverComponent,
    ResilveringIndicatorComponent,
    FailoverUpgradeIndicatorComponent,
  ],
  exports: [
    ChangePasswordDialogComponent,
    PageTitleHeaderComponent,
    SecondaryMenuComponent,
    NavigationComponent,
    CopyrightLineComponent,
    TopbarComponent,
    PageHeaderDirective,
  ],
})
export class LayoutModule {}
