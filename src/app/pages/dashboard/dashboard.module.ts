import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { MaterialModule } from 'app/app-material.module';
import { AppCommonModule } from 'app/components/common/app-common.module';
import { CoreComponents } from 'app/core/components/core-components.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { CastModule } from 'app/modules/cast/cast.module';
import { ChartsModule } from 'app/modules/charts/charts.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxDropGridModule } from 'app/pages/common/ix-drop-grid/ix-drop-grid.module';
import { DashboardFormComponent } from 'app/pages/dashboard/components/dashboard-form/dashboard-form.component';
import { DashboardComponent } from 'app/pages/dashboard/components/dashboard/dashboard.component';
import { WidgetControllerComponent } from 'app/pages/dashboard/components/widget-controller/widget-controller.component';
import { WidgetCpuComponent } from 'app/pages/dashboard/components/widget-cpu/widget-cpu.component';
import WidgetHelpComponent from 'app/pages/dashboard/components/widget-help/widget-help.component';
import { WidgetMemoryComponent } from 'app/pages/dashboard/components/widget-memory/widget-memory.component';
import { WidgetNetworkComponent } from 'app/pages/dashboard/components/widget-network/widget-network.component';
import { WidgetNicComponent } from 'app/pages/dashboard/components/widget-nic/widget-nic.component';
import { WidgetPoolComponent } from 'app/pages/dashboard/components/widget-pool/widget-pool.component';
import { WidgetStorageComponent } from 'app/pages/dashboard/components/widget-storage/widget-storage.component';
import { SimpleFailoverBtnDialogComponent } from 'app/pages/dashboard/components/widget-sys-info/simple-failover-btn-dialog.component';
import {
  SimpleFailoverBtnComponent,
} from 'app/pages/dashboard/components/widget-sys-info/simple-failover-btn.component';
import { WidgetSysInfoComponent } from 'app/pages/dashboard/components/widget-sys-info/widget-sys-info.component';
import { WidgetComponent } from 'app/pages/dashboard/components/widget/widget.component';
import { EntityModule } from '../../modules/entity/entity.module';
import { routing } from './dashboard.routing';

@NgModule({
  imports: [
    CoreComponents,
    CommonModule,
    CommonDirectivesModule,
    FormsModule,
    ReactiveFormsModule,
    IxFormsModule,
    routing,
    MaterialModule,
    AppCommonModule,
    EntityModule,
    TranslateModule,
    CastModule,
    IxDropGridModule,
    ChartsModule,
  ],
  declarations: [
    DashboardComponent,
    DashboardFormComponent,
    WidgetComponent,
    WidgetSysInfoComponent,
    WidgetNicComponent,
    WidgetCpuComponent,
    WidgetMemoryComponent,
    WidgetHelpComponent,
    WidgetPoolComponent,
    WidgetControllerComponent,
    WidgetNetworkComponent,
    WidgetStorageComponent,
    SimpleFailoverBtnComponent,
    SimpleFailoverBtnDialogComponent,
  ],
  entryComponents: [
    WidgetComponent,
    WidgetSysInfoComponent,
    WidgetHelpComponent,
    WidgetNicComponent,
    WidgetCpuComponent,
    WidgetMemoryComponent,
    WidgetPoolComponent,
    WidgetControllerComponent,
    WidgetNetworkComponent,
    WidgetStorageComponent,
  ],
})
export class DashboardModule {
}
