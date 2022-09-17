import { PortalModule } from '@angular/cdk/portal';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ChartistModule } from 'ng-chartist';
import { CoreComponents } from 'app/core/core-components.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { AlertsModule } from 'app/modules/alerts/alerts.module';
import { CastModule } from 'app/modules/cast/cast.module';
import { ConsoleMessagesStore } from 'app/modules/common/console-footer/console-messages.store';
import { AboutDialogComponent } from 'app/modules/common/dialog/about/about-dialog.component';
import { ConfirmDialogComponent } from 'app/modules/common/dialog/confirm-dialog/confirm-dialog.component';
import { ConsolePanelDialogComponent } from 'app/modules/common/dialog/console-panel/console-panel-dialog.component';
import { DirectoryServicesMonitorComponent } from 'app/modules/common/dialog/directory-services-monitor/directory-services-monitor.component';
import { ErrorDialogComponent } from 'app/modules/common/dialog/error-dialog/error-dialog.component';
import { GeneralDialogComponent } from 'app/modules/common/dialog/general-dialog/general-dialog.component';
import { InfoDialogComponent } from 'app/modules/common/dialog/info-dialog/info-dialog.component';
import { RedirectDialogComponent } from 'app/modules/common/dialog/redirect-dialog/redirect-dialog.component';
import {
  ResilverProgressDialogComponent,
} from 'app/modules/common/dialog/resilver-progress/resilver-progress.component';
import { UpdateDialogComponent } from 'app/modules/common/dialog/update-dialog/update-dialog.component';
import { AdminLayoutComponent } from 'app/modules/common/layouts/admin-layout/admin-layout.component';
import { AuthLayoutComponent } from 'app/modules/common/layouts/auth-layout/auth-layout.component';
import { ModalComponent } from 'app/modules/common/modal/modal.component';
import { SearchInputComponent } from 'app/modules/common/search-input/search-input.component';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { JobsModule } from 'app/modules/jobs/jobs.module';
import { LayoutModule } from 'app/modules/layout/layout.module';
import { TooltipModule } from 'app/modules/tooltip/tooltip.module';
import { LanguageService } from 'app/services';
import { LocaleService } from 'app/services/locale.service';
import { ConsoleFooterComponent } from './console-footer/console-footer.component';
import { CopyrightLineComponent } from './copyright-line/copyright-line.component';

@NgModule({
  imports: [
    CastModule,
    ChartistModule,
    CommonDirectivesModule,
    CommonModule,
    CoreComponents,
    FlexLayoutModule,
    HttpClientModule,
    IxFormsModule,
    JobsModule,
    MatBadgeModule,
    MatButtonModule,
    EntityModule,
    MatCheckboxModule,
    MatDialogModule,
    MatDividerModule,
    IxIconModule,
    MatInputModule,
    MatListModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTableModule,
    MatTooltipModule,
    PortalModule,
    RouterModule,
    ScrollingModule,
    TooltipModule,
    TranslateModule,
    LayoutModule,
    MatSidenavModule,
    AlertsModule,
  ],
  declarations: [
    AboutDialogComponent,
    ConfirmDialogComponent,
    ConsolePanelDialogComponent,
    DirectoryServicesMonitorComponent,
    ErrorDialogComponent,
    GeneralDialogComponent,
    InfoDialogComponent,
    ModalComponent,
    RedirectDialogComponent,
    SearchInputComponent,
    UpdateDialogComponent,
    CopyrightLineComponent,
    ResilverProgressDialogComponent,
    AuthLayoutComponent,
    AdminLayoutComponent,
    ConsoleFooterComponent,
  ],
  providers: [
    LanguageService,
    LocaleService,
    ConsoleMessagesStore,
  ],
  exports: [
    SearchInputComponent,
    CopyrightLineComponent,
    ModalComponent,
  ],
})
export class AppCommonModule {}
