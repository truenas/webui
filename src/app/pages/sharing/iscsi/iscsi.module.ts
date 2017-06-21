import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgaModule } from '../../../theme/nga.module';
import { DynamicFormsCoreModule } from '@ng2-dynamic-forms/core';
import { DynamicFormsBootstrapUIModule } from '@ng2-dynamic-forms/ui-bootstrap';

import { EntityModule } from '../../common/entity/entity.module';
import { routing } from './iscsi.routing';

import { ISCSI } from './iscsi.component';
import { GlobalconfigurationComponent } from './globalconfiguration/';
import { PortalListComponent } from './portal/portal-list/';
import { PortalDeleteComponent } from './portal/portal-delete/';
import { PortalAddComponent } from './portal/portal-add/';
import { PortalEditComponent } from './portal/portal-edit/';
import { InitiatorListComponent } from './initiator/initiator-list/';
import { InitiatorFormComponent } from './initiator/initiator-form/';
import { InitiatorDeleteComponent } from './initiator/initiator-delete/';
import { AuthorizedAccessListComponent } from './authorizedaccess/authorizedaccess-list/';
import { AuthorizedAccessFormComponent } from './authorizedaccess/authorizedaccess-form/';
import { AuthorizedAccessDeleteComponent } from './authorizedaccess/authorizedaccess-delete/';
import { TargetListComponent } from './target/target-list/';
import { TargetDeleteComponent } from './target/target-delete/';
import { TargetAddComponent } from './target/target-add/';

@NgModule({
  imports: [
    EntityModule,
    DynamicFormsCoreModule.forRoot(),
    DynamicFormsBootstrapUIModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgaModule,
    routing
  ],
  declarations: [
    ISCSI,
    GlobalconfigurationComponent,
    PortalListComponent,
    PortalDeleteComponent,
    PortalAddComponent,
    PortalEditComponent,
    InitiatorListComponent,
    InitiatorFormComponent,
    InitiatorDeleteComponent,
    AuthorizedAccessListComponent,
    AuthorizedAccessFormComponent,
    AuthorizedAccessDeleteComponent,
    TargetListComponent,
    TargetDeleteComponent,
    TargetAddComponent,
  ],
  providers: [
  ]
})
export class ISCSIModule { }
