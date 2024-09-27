import {
  AsyncPipe, DecimalPipe, JsonPipe,
} from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconButton } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSortModule } from '@angular/material/sort';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { CopyButtonComponent } from 'app/modules/buttons/copy-button/copy-button.component';
import { EntityModule } from 'app/modules/entity/entity.module';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTablePagerComponent } from 'app/modules/ix-table/components/ix-table-pager/ix-table-pager.component';
import { IxTableCellDirective } from 'app/modules/ix-table/directives/ix-table-cell.directive';
import { IxTableDetailsRowDirective } from 'app/modules/ix-table/directives/ix-table-details-row.directive';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { JobLogsRowComponent } from 'app/pages/jobs/job-logs-row/job-logs-row.component';
import { JobNameComponent } from 'app/pages/jobs/job-name/job-name.component';
import { routing } from 'app/pages/jobs/jobs-list.routing';
import { JobsListComponent } from './jobs-list/jobs-list.component';

@NgModule({
  imports: [
    EntityModule,
    IxIconComponent,
    MatTooltipModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatCardModule,
    TranslateModule,
    ReactiveFormsModule,
    routing,
    MatSortModule,
    MatButtonToggleModule,
    SearchInput1Component,
    MapValuePipe,
    CopyButtonComponent,
    MatIconButton,
    AsyncPipe,
    DecimalPipe,
    JsonPipe,
    UiSearchDirective,
    IxTableComponent,
    IxTableEmptyDirective,
    IxTableHeadComponent,
    IxTableBodyComponent,
    IxTableCellDirective,
    IxTableDetailsRowDirective,
    IxTablePagerComponent,
    TestDirective,
    PageHeaderComponent,
  ],
  declarations: [JobsListComponent, JobLogsRowComponent, JobNameComponent],
})
export class JobsListModule { }
