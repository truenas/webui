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
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { CastModule } from 'app/modules/cast/cast.module';
import { NgxOrderedListboxModule } from 'app/modules/common/ordered-list/ordered-list.module';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { NetworkConfigurationComponent } from 'app/pages/network/components/configuration/configuration.component';
import {
  DefaultGatewayDialogComponent,
} from 'app/pages/network/components/default-gateway-dialog/default-gateway-dialog.component';
import { InterfaceFormComponent } from 'app/pages/network/components/interface-form/interface-form.component';
import {
  NetworkConfigurationCardComponent,
} from 'app/pages/network/components/network-configuration-card/network-configuration-card.component';
import { StaticRouteFormComponent } from 'app/pages/network/components/static-route-form/static-route-form.component';
import { InterfacesStore } from 'app/pages/network/stores/interfaces.store';
import { NetworkService } from 'app/services';
import { InterfaceStatusIconComponent } from './components/interfaces-card/interface-status-icon/interface-status-icon.component';
import { InterfacesCardComponent } from './components/interfaces-card/interfaces-card.component';
import { IpAddressesCellComponent } from './components/interfaces-card/ip-addresses-cell/ip-addresses-cell.component';
import { IpmiFormComponent } from './components/ipmi-form/ipmi-form.component';
import { NetworkComponent } from './network.component';
import { routing } from './network.routing';

@NgModule({
  imports: [
    EntityModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
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
    TestIdModule,
    NgxOrderedListboxModule,
    IxTable2Module,
    MatTooltipModule,
  ],
  declarations: [
    StaticRouteFormComponent,
    InterfaceFormComponent,
    NetworkConfigurationComponent,
    IpmiFormComponent,
    NetworkComponent,
    NetworkConfigurationCardComponent,
    DefaultGatewayDialogComponent,
    InterfacesCardComponent,
    IpAddressesCellComponent,
    InterfaceStatusIconComponent,
  ],
  providers: [
    NetworkService,
    InterfacesStore,
  ],
})
export class NetworkModule {
}
