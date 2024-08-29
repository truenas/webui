import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
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
import { CommonDirectivesModule } from 'app/directives/common-directives.module';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { EntityModule } from 'app/modules/entity/entity.module';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxChipsComponent } from 'app/modules/forms/ix-forms/components/ix-chips/ix-chips.component';
import { IxErrorsComponent } from 'app/modules/forms/ix-forms/components/ix-errors/ix-errors.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxListComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list.component';
import { IxRadioGroupComponent } from 'app/modules/forms/ix-forms/components/ix-radio-group/ix-radio-group.component';
import {
  IxModalHeaderComponent,
} from 'app/modules/forms/ix-forms/components/ix-slide-in/components/ix-modal-header/ix-modal-header.component';
import { InterfaceStatusIconComponent } from 'app/modules/interface-status-icon/interface-status-icon.component';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { IxTableModule } from 'app/modules/ix-table/ix-table.module';
import { NgxOrderedListboxModule } from 'app/modules/lists/ordered-list/ordered-list.module';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { CastPipe } from 'app/modules/pipes/cast/cast.pipe';
import { FormatDateTimePipe } from 'app/modules/pipes/format-date-time/format-datetime.pipe';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { NetworkConfigurationComponent } from 'app/pages/network/components/configuration/configuration.component';
import {
  DefaultGatewayDialogComponent,
} from 'app/pages/network/components/default-gateway-dialog/default-gateway-dialog.component';
import { InterfaceFormComponent } from 'app/pages/network/components/interface-form/interface-form.component';
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
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { IxListItemComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list-item/ix-list-item.component';
import {
  IxIpInputWithNetmaskComponent,
} from 'app/modules/forms/ix-forms/components/ix-ip-input-with-netmask/ix-ip-input-with-netmask.component';

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
    TranslateModule,
    CommonDirectivesModule,
    MatDialogModule,
    TestIdModule,
    NgxOrderedListboxModule,
    IxTableModule,
    MatTooltipModule,
    AppLoaderModule,
    InterfaceStatusIconComponent,
    EmptyComponent,
    CastPipe,
    FormatDateTimePipe,
    IxModalHeaderComponent,
    IxFieldsetComponent,
    IxInputComponent,
    IxCheckboxComponent,
    IxChipsComponent,
    IxRadioGroupComponent,
    IxSelectComponent,
    IxListComponent,
    IxListItemComponent,
    IxIpInputWithNetmaskComponent,
    IxErrorsComponent,
    FormActionsComponent,
  ],
  declarations: [
    DefaultGatewayDialogComponent,
    InterfaceFormComponent,
    InterfacesCardComponent,
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
