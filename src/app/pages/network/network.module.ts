import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { NgxUploaderModule } from 'ngx-uploader';
import { MaterialModule } from 'app/app-material.module';
import { CoreService } from 'app/core/services/core-service/core.service';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { NetworkService } from 'app/services';
import { EntityFormService } from '../common/entity/entity-form/services/entity-form.service';
import { EntityModule } from '../common/entity/entity.module';
import { CardWidgetComponent } from './card-widget/card-widget.component';
import { ConfigurationComponent } from './forms/configuration.component';
import { InterfacesFormComponent } from './forms/interfaces-form.component';
import { IPMIFromComponent } from './forms/ipmi-form.component';
import { OpenvpnClientComponent } from './forms/service-openvpn-client.component';
import { OpenvpnServerComponent } from './forms/service-openvpn-server.component';
import { StaticRouteFormComponent } from './forms/staticroute-form.component';
import { NetworkComponent } from './network.component';
import { routing } from './network.routing';

@NgModule({
  imports: [
    EntityModule, CommonModule, FormsModule,
    ReactiveFormsModule, NgxUploaderModule, routing, MaterialModule, FlexLayoutModule,
    TranslateModule, CommonDirectivesModule,
  ],
  declarations: [
    StaticRouteFormComponent,
    InterfacesFormComponent,
    ConfigurationComponent,
    IPMIFromComponent,
    NetworkComponent,
    CardWidgetComponent,
    OpenvpnClientComponent,
    OpenvpnServerComponent,
  ],
  providers: [NetworkService, EntityFormService, CoreService],
})
export class NetworkModule {
}
