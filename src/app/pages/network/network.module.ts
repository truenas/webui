import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NgxUploaderModule } from 'ngx-uploader';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { CastModule } from 'app/modules/cast/cast.module';
import { EntityFormService } from 'app/modules/entity/entity-form/services/entity-form.service';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { NetworkConfigurationComponent } from 'app/pages/network/components/configuration/configuration.component';
import {
  DefaultGatewayDialogComponent,
} from 'app/pages/network/components/default-gateway-dialog/default-gateway-dialog.component';
import {
  DownloadClientConfigModalComponent,
} from 'app/pages/network/components/download-client-config-modal/download-client-config-modal.component';
import { InterfaceFormComponent } from 'app/pages/network/components/interface-form/interface-form.component';
import {
  IpmiIdentifyDialogComponent,
} from 'app/pages/network/components/ipmi-identify-dialog/ipmi-identify-dialog.component';
import {
  NetworkConfigurationCardComponent,
} from 'app/pages/network/components/network-configuration-card/network-configuration-card.component';
import { OpenVpnClientConfigComponent } from 'app/pages/network/components/open-vpn-client-config/open-vpn-client-config.component';
import { OpenVpnServerConfigComponent } from 'app/pages/network/components/open-vpn-server-config/open-vpn-server-config.component';
import { StaticRouteFormComponent } from 'app/pages/network/components/static-route-form/static-route-form.component';
import { NetworkService } from 'app/services';
import { IpmiFormComponent } from './components/forms/ipmi-form.component';
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
    IxIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatToolbarModule,
    FlexLayoutModule,
    TranslateModule,
    CommonDirectivesModule,
    IxFormsModule,
    CastModule,
    MatDialogModule,
  ],
  declarations: [
    StaticRouteFormComponent,
    InterfaceFormComponent,
    NetworkConfigurationComponent,
    IpmiFormComponent,
    NetworkComponent,
    OpenVpnServerConfigComponent,
    OpenVpnClientConfigComponent,
    NetworkConfigurationCardComponent,
    DownloadClientConfigModalComponent,
    IpmiIdentifyDialogComponent,
    DefaultGatewayDialogComponent,
  ],
  providers: [
    NetworkService,
    EntityFormService,
    TranslateService,
  ],
})
export class NetworkModule {
}
