import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../appMaterial.module';

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
import { GlobalconfigurationComponent } from './iscsi/globalconfiguration/';
import { PortalListComponent } from './iscsi/portal/portal-list/';
import { PortalAddComponent } from './iscsi/portal/portal-add/';
import { PortalEditComponent } from './iscsi/portal/portal-edit/';
import { InitiatorListComponent } from './iscsi/initiator/initiator-list/';
import { InitiatorFormComponent } from './iscsi/initiator/initiator-form/';
import { AuthorizedAccessListComponent } from './iscsi/authorizedaccess/authorizedaccess-list/';
import { AuthorizedAccessFormComponent } from './iscsi/authorizedaccess/authorizedaccess-form/';
import { TargetListComponent} from './iscsi/target/target-list/';
import { TargetAddComponent } from './iscsi/target/target-add/';
import { TargetEditComponent} from './iscsi/target/target-edit/';
import { ExtentListComponent } from './iscsi/extent/extent-list/';
import { ExtentFormComponent } from './iscsi/extent/extent-form/';
import { AssociatedTargetListComponent } from './iscsi/associated-target/associated-target-list/';
import { AssociatedTargetFormComponent } from './iscsi/associated-target/associated-target-form/';

@NgModule({
  imports : [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    routing,
    EntityModule,
    MaterialModule
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
    GlobalconfigurationComponent,
    PortalListComponent,
    PortalAddComponent,
    PortalEditComponent,
    InitiatorListComponent,
    InitiatorFormComponent,
    AuthorizedAccessListComponent,
    AuthorizedAccessFormComponent,
    TargetListComponent,
    TargetAddComponent,
    TargetEditComponent,
    ExtentListComponent,
    ExtentFormComponent,
    AssociatedTargetListComponent,
    AssociatedTargetFormComponent,
  ],
  providers : [
    JailService,
    EntityFormService,
    UserService,
  ]
})
export class SharingModule {
}