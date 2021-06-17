import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { MaterialModule } from 'app/appMaterial.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { UserService } from 'app/services/user.service';
import { EntityFormService } from '../common/entity/entity-form/services/entity-form.service';
import { EntityModule } from '../common/entity/entity.module';
import { SharesDashboardComponent } from './components/shares-dashboard/shares-dashboard.component';
import { AssociatedTargetFormComponent } from './iscsi/associated-target/associated-target-form';
import { AssociatedTargetListComponent } from './iscsi/associated-target/associated-target-list';
import { AuthorizedAccessFormComponent } from './iscsi/authorizedaccess/authorizedaccess-form';
import { AuthorizedAccessListComponent } from './iscsi/authorizedaccess/authorizedaccess-list';
import { ExtentFormComponent } from './iscsi/extent/extent-form';
import { ExtentListComponent } from './iscsi/extent/extent-list';
import { FibreChannelPortComponent } from './iscsi/fibre-channel-ports/fibre-channel-port/fibre-channel-port.component';
import { FibreChannelPortsComponent } from './iscsi/fibre-channel-ports/fibre-channel-ports.component';
import { GlobalconfigurationComponent } from './iscsi/globalconfiguration';
import { InitiatorFormComponent } from './iscsi/initiator/initiator-form';
import { DynamicListComponent } from './iscsi/initiator/initiator-form/dynamic-list/dynamic-list-component';
import { InitiatorListComponent } from './iscsi/initiator/initiator-list';
import { IscsiWizardComponent } from './iscsi/iscsi-wizard/iscsi-wizard.component';
import { ISCSI } from './iscsi/iscsi.component';
import { PortalFormComponent } from './iscsi/portal/portal-form';
import { PortalListComponent } from './iscsi/portal/portal-list';
import { TargetFormComponent } from './iscsi/target/target-form';
import { TargetListComponent } from './iscsi/target/target-list';
import { NFSFormComponent } from './nfs/nfs-form';
import { NFSListComponent } from './nfs/nfs-list';
import { routing } from './sharing.routing';
import { SMBAclComponent } from './smb/smb-acl/smb-acl.component';
import { SMBFormComponent } from './smb/smb-form';
import { SMBListComponent } from './smb/smb-list';
import { WebdavFormComponent } from './webdav/webdav-form';
import { WebdavListComponent } from './webdav/webdav-list';

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
  ],
  declarations: [
    NFSListComponent,
    NFSFormComponent,
    SharesDashboardComponent,
    WebdavListComponent,
    WebdavFormComponent,
    SMBListComponent,
    SMBFormComponent,
    SMBAclComponent,
    ISCSI,
    IscsiWizardComponent,
    GlobalconfigurationComponent,
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
  entryComponents: [FibreChannelPortComponent],
})
export class SharingModule {
}
