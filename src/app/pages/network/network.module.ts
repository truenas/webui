import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {NgUploaderModule} from 'ngx-uploader';
import { MaterialModule } from '../../appMaterial.module';
import { FlexLayoutModule } from '@angular/flex-layout';
import { TranslateModule } from '@ngx-translate/core';

import {EntityModule} from '../common/entity/entity.module';
import {NetworkService} from '../../services';
import { EntityFormService } from '../common/entity/entity-form/services/entity-form.service';

import {StaticRouteFormComponent} from './staticroutes/staticroute-form/';
import {StaticRouteListComponent} from './staticroutes/staticroute-list/';
import {InterfacesFormComponent} from './interfaces/interfaces-form/';
import {InterfacesListComponent} from './interfaces/interfaces-list/';
import {ConfigurationComponent} from './configuration/';
import {IPMIComponent} from './ipmi';
import { NetworkSummaryComponent } from './networksummary/networksummary.component';
import {routing} from './network.routing';

@NgModule({
  imports : [
    EntityModule, CommonModule, FormsModule,
    ReactiveFormsModule, NgUploaderModule, routing, MaterialModule, FlexLayoutModule, TranslateModule
  ],
  declarations : [
    StaticRouteFormComponent,
    StaticRouteListComponent,
    InterfacesListComponent,
    InterfacesFormComponent,
    ConfigurationComponent,
    IPMIComponent,
    NetworkSummaryComponent,
  ],
  providers : [NetworkService, EntityFormService]
})
export class NetworkModule {
}
