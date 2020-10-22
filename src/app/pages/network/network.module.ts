import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxUploaderModule } from 'ngx-uploader';
import { MaterialModule } from '../../appMaterial.module';
import { FlexLayoutModule } from '@angular/flex-layout';
import { TranslateModule } from '@ngx-translate/core';

import { EntityModule } from '../common/entity/entity.module';
import { NetworkService } from '../../services';
import { EntityFormService } from '../common/entity/entity-form/services/entity-form.service';
import { CoreService } from 'app/core/services/core.service';

import { StaticRouteFormComponent } from './forms/staticroute-form.component';
import { InterfacesFormComponent } from './forms/interfaces-form.component';
import { ConfigurationComponent } from './forms/configuration.component';
import { IPMIFromComponent } from './forms/ipmi-form.component';
import { routing } from './network.routing';

import { NetworkComponent } from './netwrok.component';
import { CardWidgetComponent } from './card-widget/card-widget.component';
import { NameserverFormComponent } from './forms/nameserver-form.component';
import { DefaultRouteFormComponent } from './forms/default-route-form.component';
import { OpenvpnClientComponent } from './forms/service-openvpn-client.component';
import { OpenvpnServerComponent } from './forms/service-openvpn-server.component';

@NgModule({
  imports: [
    EntityModule, CommonModule, FormsModule,
    ReactiveFormsModule, NgxUploaderModule, routing, MaterialModule, FlexLayoutModule, TranslateModule
  ],
  declarations: [
    StaticRouteFormComponent,
    InterfacesFormComponent,
    ConfigurationComponent,
    IPMIFromComponent,
    NetworkComponent,
    CardWidgetComponent,
    NameserverFormComponent,
    DefaultRouteFormComponent,
    OpenvpnClientComponent,
    OpenvpnServerComponent,
  ],
  providers: [NetworkService, EntityFormService, CoreService]
})
export class NetworkModule {
}
