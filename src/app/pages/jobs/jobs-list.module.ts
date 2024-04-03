import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSortModule } from '@angular/material/sort';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { CoreComponents } from 'app/core/core-components.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import { LayoutModule } from 'app/modules/layout/layout.module';
import { SearchInput1Component } from 'app/modules/search-input1/search-input1.component';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { JobLogsRowComponent } from 'app/pages/jobs/job-logs-row/job-logs-row.component';
import { JobNameComponent } from 'app/pages/jobs/job-name/job-name.component';
import { routing } from 'app/pages/jobs/jobs-list.routing';
import { JobsListComponent } from './jobs-list/jobs-list.component';

@NgModule({
  imports: [
    CoreComponents,
    EntityModule,
    CommonModule,
    IxIconModule,
    MatTooltipModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatCardModule,
    IxTable2Module,
    TranslateModule,
    ReactiveFormsModule,
    routing,
    CommonDirectivesModule,
    LayoutModule,
    MatSortModule,
    MatButtonToggleModule,
    TestIdModule,
    SearchInput1Component,
  ],
  declarations: [JobsListComponent, JobLogsRowComponent, JobNameComponent],
})
export class JobsListModule { }
