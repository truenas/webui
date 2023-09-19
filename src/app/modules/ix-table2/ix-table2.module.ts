import { CommonModule } from '@angular/common';
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
import { NgxFilesizeModule } from 'ngx-filesize';
import { CoreComponents } from 'app/core/core-components.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { IxTable2EmptyRowComponent } from 'app/modules/ix-table2/components/ix-empty-row/ix-empty-row.component';
import { IxCellActionsComponent } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { IxCellCheckboxComponent } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-checkbox/ix-cell-checkbox.component';
import { IxCellDateComponent } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-date/ix-cell-date.component';
import { IxCellScheduleComponent } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-schedule/ix-cell-schedule.component';
import { IxCellSizeComponent } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-size/ix-cell-size.component';
import { IxCellStateButtonComponent } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-state-button/ix-cell-state-button.component';
import { IxCellTextComponent } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { IxCellToggleComponent } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-toggle/ix-cell-toggle.component';
import { IxCellYesNoComponent } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-yesno/ix-cell-yesno.component';
import { IxTableBodyComponent } from 'app/modules/ix-table2/components/ix-table-body/ix-table-body.component';
import { IxTableExpandableRowComponent } from 'app/modules/ix-table2/components/ix-table-expandable-row/ix-table-expandable-row.component';
import { IxHeaderCellCheckboxComponent } from 'app/modules/ix-table2/components/ix-table-head/head-cells/ix-header-cell-checkbox/ix-header-cell-checkbox.component';
import { IxHeaderCellTextComponent } from 'app/modules/ix-table2/components/ix-table-head/head-cells/ix-header-cell-text/ix-header-cell-text.component';
import { IxTableHeadComponent } from 'app/modules/ix-table2/components/ix-table-head/ix-table-head.component';
import { IxTablePagerComponent } from 'app/modules/ix-table2/components/ix-table-pager/ix-table-pager.component';
import { IxTablePagerShowMoreComponent } from 'app/modules/ix-table2/components/ix-table-pager-show-more/ix-table-pager-show-more.component';
import { IxTable2Component } from 'app/modules/ix-table2/components/ix-table2/ix-table2.component';
import { IxTableBodyCellDirective } from 'app/modules/ix-table2/directives/ix-body-cell.directive';
import { IxTableHeaderCellDirective } from 'app/modules/ix-table2/directives/ix-header-cell.directive';
import { IxTableCellDirective } from 'app/modules/ix-table2/directives/ix-table-cell.directive';
import { IxTableDetailsRowDirective } from 'app/modules/ix-table2/directives/ix-table-details-row.directive';
import { IxTable2EmptyDirective } from 'app/modules/ix-table2/directives/ix-table-empty.directive';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { IxTableColumnsSelectorComponent } from './components/ix-table-columns-selector/ix-table-columns-selector.component';

@NgModule({
  imports: [
    CommonModule,
    IxIconModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatTooltipModule,
    MatCheckboxModule,
    MatSelectModule,
    MatSlideToggleModule,
    TranslateModule,
    NgxFilesizeModule,
    TestIdModule,
    CoreComponents,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule,
  ],
  declarations: [
    IxTable2Component,
    IxTableHeadComponent,
    IxTableBodyComponent,
    IxTablePagerComponent,
    IxTableCellDirective,
    IxTableDetailsRowDirective,
    IxTableBodyCellDirective,
    IxTableHeaderCellDirective,
    IxCellTextComponent,
    IxCellDateComponent,
    IxCellSizeComponent,
    IxCellCheckboxComponent,
    IxCellYesNoComponent,
    IxCellActionsComponent,
    IxCellToggleComponent,
    IxCellScheduleComponent,
    IxCellStateButtonComponent,
    IxHeaderCellTextComponent,
    IxHeaderCellCheckboxComponent,
    IxTable2EmptyDirective,
    IxTable2EmptyRowComponent,
    IxTableColumnsSelectorComponent,
    IxTablePagerShowMoreComponent,
    IxTableExpandableRowComponent,
  ],
  exports: [
    IxTable2Component,
    IxTableHeadComponent,
    IxTableBodyComponent,
    IxTablePagerComponent,
    IxTableCellDirective,
    IxTableDetailsRowDirective,
    IxTableBodyCellDirective,
    IxTableHeaderCellDirective,
    IxCellTextComponent,
    IxCellDateComponent,
    IxCellSizeComponent,
    IxCellCheckboxComponent,
    IxCellYesNoComponent,
    IxCellActionsComponent,
    IxCellToggleComponent,
    IxCellScheduleComponent,
    IxCellStateButtonComponent,
    IxHeaderCellTextComponent,
    IxHeaderCellCheckboxComponent,
    IxTable2EmptyDirective,
    IxTable2EmptyRowComponent,
    IxTableColumnsSelectorComponent,
    IxTablePagerShowMoreComponent,
    IxTableExpandableRowComponent,
  ],
})
export class IxTable2Module {}
