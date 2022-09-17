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
import { BreadcrumbComponent } from 'app/modules/layout/components/breadcrumb/breadcrumb.component';
import {
  ChangePasswordDialogComponent,
} from 'app/modules/layout/components/change-password-dialog/change-password-dialog.component';
import { NavigationComponent } from 'app/modules/layout/components/navigation/navigation.component';
import { PageTitleHeaderComponent } from 'app/modules/layout/components/page-title-header/page-title-header.component';
import { SecondaryMenuComponent } from 'app/modules/layout/components/secondary-menu/secondary-menu.component';
import { DirectoryServicesIndicatorComponent } from 'app/modules/layout/components/topbar/directory-services-indicator/directory-services-indicator.component';
import { TopbarComponent } from 'app/modules/layout/components/topbar/topbar.component';
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
  ],
  declarations: [
    ChangePasswordDialogComponent,
    PageTitleHeaderComponent,
    BreadcrumbComponent,
    NavigationComponent,
    SecondaryMenuComponent,
    PowerMenuComponent,
    TopbarComponent,
    UserMenuComponent,
    DirectoryServicesIndicatorComponent,
    JobsIndicatorComponent,
  ],
  exports: [
    ChangePasswordDialogComponent,
    PageTitleHeaderComponent,
    SecondaryMenuComponent,
    NavigationComponent,
    TopbarComponent,
  ],
})
export class LayoutModule {}
