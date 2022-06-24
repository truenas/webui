import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { CoreComponents } from 'app/core/core-components.module';
import { FormatDateTimePipe } from 'app/core/pipes/format-datetime.pipe';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { CastModule } from 'app/modules/cast/cast.module';
import { AppCommonModule } from 'app/modules/common/app-common.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxTableModule } from 'app/modules/ix-tables/ix-table.module';
import { LayoutModule } from 'app/modules/layout/layout.module';
import { TooltipModule } from 'app/modules/tooltip/tooltip.module';
import { ImportPoolComponent } from 'app/pages/storage2/components/import-pool/import-pool.component';
import { ManagerComponent } from 'app/pages/storage2/components/manager/manager.component';
import { VdevComponent } from 'app/pages/storage2/components/manager/vdev/vdev.component';
import { PoolsDashboardComponent } from 'app/pages/storage2/components/pools-dashboard/pools-dashboard.component';
import { routing } from 'app/pages/storage2/storage2.routing';
import { ZfsHealthCardComponent } from './components/zfs-health-card/zfs-health-card.component';

@NgModule({
  imports: [
    routing,
    IxTableModule,
    IxFormsModule,
    TranslateModule,
    MatCardModule,
    AppCommonModule,
    MatButtonModule,
    RouterModule,
    ReactiveFormsModule,
    LayoutModule,
    MatIconModule,
    NgxDatatableModule,
    MatFormFieldModule,
    MatOptionModule,
    TooltipModule,
    FormsModule,
    FlexModule,
    MatCheckboxModule,
    MatSelectModule,
    MatMenuModule,
    CastModule,
    CommonModule,
    MatInputModule,
    CommonDirectivesModule,
    CoreComponents,
    MatProgressBarModule,
    NgxSkeletonLoaderModule,
  ],
  declarations: [
    PoolsDashboardComponent,
    ImportPoolComponent,
    VdevComponent,
    ManagerComponent,
    ZfsHealthCardComponent,
  ],
  providers: [
    FormatDateTimePipe,
  ],
})
export class Storage2Module { }
