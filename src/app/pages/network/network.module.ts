import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NgxUploaderModule } from 'ngx-uploader';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { CastModule } from 'app/modules/cast/cast.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { NetworkConfigurationComponent } from 'app/pages/network/configuration/configuration.component';
import {
  NetworkConfigurationCardComponent,
} from 'app/pages/network/network-configuration-card/network-configuration-card.component';
import { StaticRouteFormComponent } from 'app/pages/network/static-route-form/static-route-form.component';
import { NetworkService } from 'app/services';
import { CoreService } from 'app/services/core-service/core.service';
import { EntityFormService } from '../../modules/entity/entity-form/services/entity-form.service';
import { EntityModule } from '../../modules/entity/entity.module';
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
    MatCardModule,
    MatListModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatToolbarModule,
    FlexLayoutModule,
    TranslateModule,
    CommonDirectivesModule,
    IxFormsModule,
    CastModule,
  ],
  declarations: [
    StaticRouteFormComponent,
    InterfacesFormComponent,
    NetworkConfigurationComponent,
    IpmiFormComponent,
    NetworkComponent,
    OpenvpnClientComponent,
    OpenvpnServerComponent,
    NetworkConfigurationCardComponent,
  ],
  providers: [NetworkService, EntityFormService, CoreService, TranslateService],
})
export class NetworkModule {
}
