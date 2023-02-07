import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { CoreComponents } from 'app/core/core-components.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { CastModule } from 'app/modules/cast/cast.module';
import { ChartsModule } from 'app/modules/charts/charts.module';
import { AppCommonModule } from 'app/modules/common/app-common.module';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxDropGridModule } from 'app/modules/ix-drop-grid/ix-drop-grid.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { LayoutModule } from 'app/modules/layout/layout.module';
import { DashboardFormComponent } from 'app/pages/dashboard/components/dashboard-form/dashboard-form.component';
import { DashboardComponent } from 'app/pages/dashboard/components/dashboard/dashboard.component';
import { WidgetControllerComponent } from 'app/pages/dashboard/components/widget-controller/widget-controller.component';
import { WidgetCpuComponent } from 'app/pages/dashboard/components/widget-cpu/widget-cpu.component';
import { WidgetHelpComponent } from 'app/pages/dashboard/components/widget-help/widget-help.component';
import { WidgetMemoryComponent } from 'app/pages/dashboard/components/widget-memory/widget-memory.component';
import { WidgetNetworkComponent } from 'app/pages/dashboard/components/widget-network/widget-network.component';
import { WidgetNicComponent } from 'app/pages/dashboard/components/widget-nic/widget-nic.component';
import { WidgetPoolComponent } from 'app/pages/dashboard/components/widget-pool/widget-pool.component';
import { WidgetStorageComponent } from 'app/pages/dashboard/components/widget-storage/widget-storage.component';
import {
  SimpleFailoverBtnComponent,
} from 'app/pages/dashboard/components/widget-sys-info/simple-failover-btn.component';
import { WidgetSysInfoComponent } from 'app/pages/dashboard/components/widget-sys-info/widget-sys-info.component';
import { WidgetComponent } from 'app/pages/dashboard/components/widget/widget.component';
import { routing } from './dashboard.routing';

@NgModule({
  imports: [
    CoreComponents,
    CommonModule,
    CommonDirectivesModule,
    ReactiveFormsModule,
    IxFormsModule,
    routing,
    MatCardModule,
    IxIconModule,
    MatMenuModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatTooltipModule,
    MatDialogModule,
    MatGridListModule,
    MatToolbarModule,
    AppCommonModule,
    EntityModule,
    TranslateModule,
    CastModule,
    IxDropGridModule,
    ChartsModule,
    LayoutModule,
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
  ],
})
export class DashboardModule {
}
