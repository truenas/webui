import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { NgxUploaderModule } from 'ngx-uploader';
import { MaterialModule } from 'app/app-material.module';
import { CoreService } from 'app/core/services/core-service/core.service';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { CastModule } from 'app/modules/cast/cast.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { StaticRouteFormComponent } from 'app/pages/network/static-route-form/static-route-form.component';
import { NetworkService } from 'app/services';
import { EntityFormService } from '../../modules/entity/entity-form/services/entity-form.service';
import { EntityModule } from '../../modules/entity/entity.module';
import { CardWidgetComponent } from './card-widget/card-widget.component';
import { ConfigurationComponent } from './forms/configuration.component';
import { InterfacesFormComponent } from './forms/interfaces-form.component';
import { IpmiFormComponent } from './forms/ipmi-form.component';
import { OpenvpnClientComponent } from './forms/service-openvpn-client.component';
import { OpenvpnServerComponent } from './forms/service-openvpn-server.component';
import { NetworkComponent } from './network.component';
import { routing } from './network.routing';

@NgModule({
  imports: [
    EntityModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgxUploaderModule,
    routing,
    MaterialModule,
    FlexLayoutModule,
    TranslateModule,
    CommonDirectivesModule,
    IxFormsModule,
    CastModule,
  ],
  declarations: [
    StaticRouteFormComponent,
    InterfacesFormComponent,
    ConfigurationComponent,
    IpmiFormComponent,
    NetworkComponent,
    CardWidgetComponent,
    OpenvpnClientComponent,
    OpenvpnServerComponent,
  ],
  providers: [NetworkService, EntityFormService, CoreService],
})
export class NetworkModule {
}
