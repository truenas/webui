import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexModule } from '@angular/flex-layout';
import { ReactiveFormsModule } from '@angular/forms';
import { MatBadgeModule } from '@angular/material/badge';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatLegacyListModule as MatListModule } from '@angular/material/legacy-list';
import { MatLegacyMenuModule as MatMenuModule } from '@angular/material/legacy-menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CoreComponents } from 'app/core/core-components.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { AlertsModule } from 'app/modules/alerts/alerts.module';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { AdminLayoutComponent } from 'app/modules/layout/components/admin-layout/admin-layout.component';
import { AuthLayoutComponent } from 'app/modules/layout/components/auth-layout/auth-layout.component';
import {
  ChangePasswordDialogComponent,
} from 'app/modules/layout/components/change-password-dialog/change-password-dialog.component';
import { ConsoleFooterComponent } from 'app/modules/layout/components/console-footer/console-footer.component';
import { CopyrightLineComponent } from 'app/modules/layout/components/copyright-line/copyright-line.component';
import { ModalComponent } from 'app/modules/layout/components/modal/modal.component';
import { NavigationComponent } from 'app/modules/layout/components/navigation/navigation.component';
import { SecondaryMenuComponent } from 'app/modules/layout/components/secondary-menu/secondary-menu.component';
import { DirectoryServicesIndicatorComponent } from 'app/modules/layout/components/topbar/directory-services-indicator/directory-services-indicator.component';
import { TopbarComponent } from 'app/modules/layout/components/topbar/topbar.component';
import { PageHeaderModule } from 'app/modules/page-header/page-header.module';
import { PageTitleHeaderComponent } from 'app/modules/page-header/page-title-header/page-title-header.component';
import { TruecommandModule } from 'app/modules/truecommand/truecommand.module';
import { JobsIndicatorComponent } from './components/topbar/jobs-indicator/jobs-indicator.component';
import { PowerMenuComponent } from './components/topbar/power-menu/power-menu.component';
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
    EntityModule,
    PageHeaderModule,
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
    ModalComponent,
    CopyrightLineComponent,
    ConsoleFooterComponent,
    DirectoryServicesIndicatorComponent,
    JobsIndicatorComponent,
  ],
  exports: [
    ChangePasswordDialogComponent,
    PageTitleHeaderComponent,
    SecondaryMenuComponent,
    NavigationComponent,
    ModalComponent,
    CopyrightLineComponent,
    TopbarComponent,
  ],
})
export class LayoutModule {}
