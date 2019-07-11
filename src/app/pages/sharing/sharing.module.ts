import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../appMaterial.module';
import { TranslateModule } from '@ngx-translate/core';
import { FlexLayoutModule } from '@angular/flex-layout';

import { JailService } from '../../services';
import { EntityModule } from '../common/entity/entity.module';
import { EntityFormService } from '../common/entity/entity-form/services/entity-form.service';
import { UserService } from '../../services/user.service';

import { routing } from './sharing.routing';
import { AFPListComponent } from './afp/afp-list/';
import { AFPFormComponent } from './afp/afp-form/';
import { NFSListComponent } from './nfs/nfs-list/';
import { NFSFormComponent } from './nfs/nfs-form/';
import { WebdavListComponent } from './webdav/webdav-list/';
import { WebdavFormComponent } from './webdav/webdav-form/';
import { SMBListComponent } from './smb/smb-list/';
import { SMBFormComponent } from './smb/smb-form/';
import { ISCSI } from './iscsi/iscsi.component';
import { IscsiWizardComponent } from './iscsi/iscsi-wizard/iscsi-wizard.component';
import { GlobalconfigurationComponent } from './iscsi/globalconfiguration/';
import { PortalListComponent } from './iscsi/portal/portal-list/';
import { PortalFormComponent } from './iscsi/portal/portal-form/';
import { DynamciListComponent } from './iscsi/initiator/initiator-form/dynamic-list/dynamic-list-component';
import { InitiatorListComponent } from './iscsi/initiator/initiator-list/';
import { InitiatorFormComponent } from './iscsi/initiator/initiator-form/';
import { AuthorizedAccessListComponent } from './iscsi/authorizedaccess/authorizedaccess-list/';
import { AuthorizedAccessFormComponent } from './iscsi/authorizedaccess/authorizedaccess-form/';
import { TargetListComponent} from './iscsi/target/target-list/';
import { TargetFormComponent} from './iscsi/target/target-form/';
import { ExtentListComponent } from './iscsi/extent/extent-list/';
import { ExtentFormComponent } from './iscsi/extent/extent-form/';
import { AssociatedTargetListComponent } from './iscsi/associated-target/associated-target-list/';
import { AssociatedTargetFormComponent } from './iscsi/associated-target/associated-target-form/';
import { FibreChannelPortsComponent } from './iscsi/fibre-channel-ports/fibre-channel-ports.component';
import { FibreChannelPortComponent } from './iscsi/fibre-channel-ports/fibre-channel-port/fibre-channel-port.component';

@NgModule({
  imports : [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    routing,
    EntityModule,
    MaterialModule,
    TranslateModule,
    FlexLayoutModule
  ],
  declarations : [
    AFPListComponent,
    AFPFormComponent,
    NFSListComponent,
    NFSFormComponent,
    WebdavListComponent,
    WebdavFormComponent,
    SMBListComponent,
    SMBFormComponent,
    ISCSI,
    IscsiWizardComponent,
    GlobalconfigurationComponent,
    PortalListComponent,
    PortalFormComponent,
    DynamciListComponent,
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
  providers : [
    JailService,
    EntityFormService,
    UserService,
  ],
  entryComponents: [FibreChannelPortComponent]
})
export class SharingModule {
}