import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { MaterialModule } from 'app/app-material.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { CastModule } from 'app/modules/cast/cast.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { TooltipModule } from 'app/modules/tooltip/tooltip.module';
import { TargetGlobalConfigurationComponent } from 'app/pages/sharing/iscsi/target-global-configuration/target-global-configuration.component';
import { UserService } from 'app/services/user.service';
import { EntityFormService } from '../../modules/entity/entity-form/services/entity-form.service';
import { EntityModule } from '../../modules/entity/entity.module';
import { SharesDashboardComponent } from './components/shares-dashboard/shares-dashboard.component';
import { AssociatedTargetFormComponent } from './iscsi/associated-target/associated-target-form/associated-target-form.component';
import { AssociatedTargetListComponent } from './iscsi/associated-target/associated-target-list/associated-target-list.component';
import { AuthorizedAccessFormComponent } from './iscsi/authorizedaccess/authorizedaccess-form/authorizedaccess-form.component';
import { AuthorizedAccessListComponent } from './iscsi/authorizedaccess/authorizedaccess-list/authorizedaccess-list.component';
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
    FormsModule,
    ReactiveFormsModule,
    routing,
    EntityModule,
    MaterialModule,
    TranslateModule,
    FlexLayoutModule,
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
