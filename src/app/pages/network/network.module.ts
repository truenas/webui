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
import { CoreComponents } from 'app/core/core-components.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { CastModule } from 'app/modules/cast/cast.module';
import { NgxOrderedListboxModule } from 'app/modules/common/ordered-list/ordered-list.module';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { NetworkConfigurationComponent } from 'app/pages/network/components/configuration/configuration.component';
import {
  DefaultGatewayDialogComponent,
} from 'app/pages/network/components/default-gateway-dialog/default-gateway-dialog.component';
import { InterfaceFormComponent } from 'app/pages/network/components/interface-form/interface-form.component';
import { InterfaceStatusIconComponent } from 'app/pages/network/components/interfaces-card/interface-status-icon/interface-status-icon.component';
import { InterfacesCardComponent } from 'app/pages/network/components/interfaces-card/interfaces-card.component';
import { IpAddressesCellComponent } from 'app/pages/network/components/interfaces-card/ip-addresses-cell/ip-addresses-cell.component';
import { IpmiCardComponent } from 'app/pages/network/components/ipmi-card/ipmi-card.component';
import { IpmiEventsDialogComponent } from 'app/pages/network/components/ipmi-card/ipmi-events-dialog/ipmi-events-dialog.component';
import { IpmiFormComponent } from 'app/pages/network/components/ipmi-card/ipmi-form/ipmi-form.component';
import {
  NetworkConfigurationCardComponent,
} from 'app/pages/network/components/network-configuration-card/network-configuration-card.component';
import { StaticRouteDeleteDialogComponent } from 'app/pages/network/components/static-route-delete-dialog/static-route-delete-dialog.component';
import { StaticRouteFormComponent } from 'app/pages/network/components/static-route-form/static-route-form.component';
import { StaticRoutesCardComponent } from 'app/pages/network/components/static-routes-card/static-routes-card.component';
import { InterfacesStore } from 'app/pages/network/stores/interfaces.store';
import { NetworkService } from 'app/services/network.service';
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
    CoreComponents,
    AppLoaderModule,
  ],
  declarations: [
    DefaultGatewayDialogComponent,
    InterfaceFormComponent,
    InterfacesCardComponent,
    InterfaceStatusIconComponent,
    IpAddressesCellComponent,
    IpmiCardComponent,
    IpmiEventsDialogComponent,
    IpmiFormComponent,
    NetworkComponent,
    NetworkConfigurationCardComponent,
    NetworkConfigurationComponent,
    StaticRouteDeleteDialogComponent,
    StaticRouteFormComponent,
    StaticRoutesCardComponent,
  ],
  providers: [
    NetworkService,
    InterfacesStore,
  ],
})
export class NetworkModule {
}
