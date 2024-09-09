import { CdkPortalOutlet } from '@angular/cdk/portal';
import {
  AsyncPipe, NgClass, NgStyle,
} from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { CommonDirectivesModule } from 'app/directives/common-directives.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { IxTableEmptyRowComponent } from 'app/modules/ix-table/components/ix-empty-row/ix-empty-row.component';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { IxCellActionsComponent } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { IxCellCheckboxComponent } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-checkbox/ix-cell-checkbox.component';
import { IxCellDateComponent } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-date/ix-cell-date.component';
import { IxCellRelativeDateComponent } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-relative-date/ix-cell-relative-date.component';
import { IxCellScheduleComponent } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-schedule/ix-cell-schedule.component';
import { IxCellSizeComponent } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-size/ix-cell-size.component';
import { IxCellStateButtonComponent } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-state-button/ix-cell-state-button.component';
import { IxCellTemplateComponent } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-template/ix-cell-template.component';
import { IxCellTextComponent } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { IxCellToggleComponent } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-toggle/ix-cell-toggle.component';
import { IxCellYesNoComponent } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-yes-no/ix-cell-yes-no.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableDetailsRowComponent } from 'app/modules/ix-table/components/ix-table-details-row/ix-table-details-row.component';
import { IxTableExpandableRowComponent } from 'app/modules/ix-table/components/ix-table-expandable-row/ix-table-expandable-row.component';
import { IxHeaderCellCheckboxComponent } from 'app/modules/ix-table/components/ix-table-head/head-cells/ix-header-cell-checkbox/ix-header-cell-checkbox.component';
import { IxHeaderCellTextComponent } from 'app/modules/ix-table/components/ix-table-head/head-cells/ix-header-cell-text/ix-header-cell-text.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTablePagerComponent } from 'app/modules/ix-table/components/ix-table-pager/ix-table-pager.component';
import { IxTablePagerShowMoreComponent } from 'app/modules/ix-table/components/ix-table-pager-show-more/ix-table-pager-show-more.component';
import { IxTableBodyCellDirective } from 'app/modules/ix-table/directives/ix-body-cell.directive';
import { IxTableHeaderCellDirective } from 'app/modules/ix-table/directives/ix-header-cell.directive';
import { IxTableCellDirective } from 'app/modules/ix-table/directives/ix-table-cell.directive';
import { IxTableDetailsRowDirective } from 'app/modules/ix-table/directives/ix-table-details-row.directive';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { FormatDateTimePipe } from 'app/modules/pipes/format-date-time/format-datetime.pipe';
import { IxDateComponent } from 'app/modules/pipes/ix-date/ix-date.component';
import { ScheduleToCrontabPipe } from 'app/modules/pipes/schedule-to-crontab/schedule-to-crontab.pipe';
import { YesNoPipe } from 'app/modules/pipes/yes-no/yes-no.pipe';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { IxTableColumnsSelectorComponent } from './components/ix-table-columns-selector/ix-table-columns-selector.component';

const components = [
  IxTableComponent,
  IxTableHeadComponent,
  IxTableBodyComponent,
  IxTablePagerComponent,
  IxCellTemplateComponent,
  IxTableCellDirective,
  IxTableDetailsRowDirective,
  IxTableBodyCellDirective,
  IxTableHeaderCellDirective,
  IxCellTextComponent,
  IxCellDateComponent,
  IxCellRelativeDateComponent,
  IxCellSizeComponent,
  IxCellCheckboxComponent,
  IxCellYesNoComponent,
  IxCellActionsComponent,
  IxCellToggleComponent,
  IxCellScheduleComponent,
  IxCellStateButtonComponent,
  IxHeaderCellTextComponent,
  IxHeaderCellCheckboxComponent,
  IxTableEmptyDirective,
  IxTableEmptyRowComponent,
  IxTableColumnsSelectorComponent,
  IxTablePagerShowMoreComponent,
  IxTableExpandableRowComponent,
  IxTableDetailsRowComponent,
];

@NgModule({
  imports: [
    IxIconModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatTooltipModule,
    MatCheckboxModule,
    MatSelectModule,
    MatSlideToggleModule,
    TranslateModule,
    CommonDirectivesModule,
    TestIdModule,
    IxDateComponent,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule,
    FileSizePipe,
    YesNoPipe,
    ScheduleToCrontabPipe,
    CdkPortalOutlet,
    FormatDateTimePipe,
    AsyncPipe,
    NgStyle,
    NgClass,
  ],
  declarations: [
    ...components,
  ],
  exports: [
    ...components,
  ],
  providers: [
    FormatDateTimePipe,
  ],
})
export class IxTableModule {}
