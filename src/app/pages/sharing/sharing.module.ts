import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { CastModule } from 'app/modules/cast/cast.module';
import { EntityFormService } from 'app/modules/entity/entity-form/services/entity-form.service';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { TooltipModule } from 'app/modules/tooltip/tooltip.module';
import { AuthorizedAccessFormComponent } from 'app/pages/sharing/iscsi/authorized-access/authorized-access-form/authorized-access-form.component';
import { AuthorizedAccessListComponent } from 'app/pages/sharing/iscsi/authorized-access/authorized-access-list/authorized-access-list.component';
import { TargetGlobalConfigurationComponent } from 'app/pages/sharing/iscsi/target-global-configuration/target-global-configuration.component';
import { RestartSmbDialogComponent } from 'app/pages/sharing/smb/smb-form/restart-smb-dialog/restart-smb-dialog.component';
import { UserService } from 'app/services/user.service';
import { SharesDashboardComponent } from './components/shares-dashboard/shares-dashboard.component';
import { AssociatedTargetFormComponent } from './iscsi/associated-target/associated-target-form/associated-target-form.component';
import { AssociatedTargetListComponent } from './iscsi/associated-target/associated-target-list/associated-target-list.component';
import { ExtentFormComponent } from './iscsi/extent/extent-form/extent-form.component';
import { ExtentListComponent } from './iscsi/extent/extent-list/extent-list.component';
import { FibreChannelPortComponent } from './iscsi/fibre-channel-ports/fibre-channel-port/fibre-channel-port.component';
import { FibreChannelPortsComponent } from './iscsi/fibre-channel-ports/fibre-channel-ports.component';
import { DynamicListComponent } from './iscsi/initiator/initiator-form/dynamic-list/dynamic-list.component';
import { InitiatorFormComponent } from './iscsi/initiator/initiator-form/initiator-form.component';
import { InitiatorListComponent } from './iscsi/initiator/initiator-list/initiator-list.component';
import { IscsiWizardComponent } from './iscsi/iscsi-wizard/iscsi-wizard.component';
import { IscsiComponent } from './iscsi/iscsi.component';
import { PortalFormComponent } from './iscsi/portal/portal-form/portal-form.component';
import { PortalListComponent } from './iscsi/portal/portal-list/portal-list.component';
import { TargetFormComponent } from './iscsi/target/target-form/target-form.component';
import { TargetListComponent } from './iscsi/target/target-list/target-list.component';
import { NfsFormComponent } from './nfs/nfs-form/nfs-form.component';
import { NfsListComponent } from './nfs/nfs-list/nfs-list.component';
import { routing } from './sharing.routing';
import { SmbAclComponent } from './smb/smb-acl/smb-acl.component';
import { SmbFormComponent } from './smb/smb-form/smb-form.component';
import { SmbListComponent } from './smb/smb-list/smb-list.component';
import { WebdavFormComponent } from './webdav/webdav-form/webdav-form.component';
import { WebdavListComponent } from './webdav/webdav-list/webdav-list.component';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    routing,
    EntityModule,
    TranslateModule,
    MatProgressBarModule,
    MatTabsModule,
    MatCardModule,
    IxIconModule,
    FlexLayoutModule,
    MatListModule,
    MatDialogModule,
    MatMenuModule,
    MatFormFieldModule,
    MatTooltipModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    CommonDirectivesModule,
    TooltipModule,
    CastModule,
    IxFormsModule,
  ],
  declarations: [
    NfsListComponent,
    NfsFormComponent,
    SharesDashboardComponent,
    WebdavListComponent,
    WebdavFormComponent,
    SmbListComponent,
    SmbFormComponent,
    RestartSmbDialogComponent,
    SmbAclComponent,
    IscsiComponent,
    IscsiWizardComponent,
    TargetGlobalConfigurationComponent,
    PortalListComponent,
    PortalFormComponent,
    DynamicListComponent,
    InitiatorListComponent,
    InitiatorFormComponent,
    AuthorizedAccessListComponent,
    AuthorizedAccessFormComponent,
    TargetListComponent,
    TargetFormComponent,
    ExtentListComponent,
    ExtentFormComponent,
    AssociatedTargetListComponent,
    AssociatedTargetFormComponent,
    FibreChannelPortsComponent,
    FibreChannelPortComponent,
  ],
  providers: [
    EntityFormService,
    UserService,
  ],
})
export class SharingModule {
}
