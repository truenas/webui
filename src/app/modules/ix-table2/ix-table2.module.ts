import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { CoreComponents } from 'app/core/core-components.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { IxTable2EmptyRowComponent } from 'app/modules/ix-table2/components/ix-empty-row/ix-empty-row.component';
import { IxBodyCellBaseComponent } from 'app/modules/ix-table2/components/ix-table-body/ix-table-body-cells/ix-body-cell-base/ix-body-cell-base.component';
import { IxBodyCellCheckboxComponent } from 'app/modules/ix-table2/components/ix-table-body/ix-table-body-cells/ix-body-cell-checkbox/ix-body-cell-checkbox.component';
import { IxBodyCellDateComponent } from 'app/modules/ix-table2/components/ix-table-body/ix-table-body-cells/ix-body-cell-date/ix-body-cell-date.component';
import { IxBodyCellDeleteComponent } from 'app/modules/ix-table2/components/ix-table-body/ix-table-body-cells/ix-body-cell-delete/ix-body-cell-delete.component';
import { IxBodyCellSizeComponent } from 'app/modules/ix-table2/components/ix-table-body/ix-table-body-cells/ix-body-cell-size/ix-body-cell-size.component';
import { IxBodyCellYesNoComponent } from 'app/modules/ix-table2/components/ix-table-body/ix-table-body-cells/ix-body-cell-yesno/ix-body-cell-yesno.component';
import { IxTableBodyComponent } from 'app/modules/ix-table2/components/ix-table-body/ix-table-body.component';
import { IxHeaderCellBaseComponent } from 'app/modules/ix-table2/components/ix-table-head/ix-table-head-cells/ix-header-cell-base/ix-header-cell-base.component';
import { IxHeaderCellCheckboxComponent } from 'app/modules/ix-table2/components/ix-table-head/ix-table-head-cells/ix-header-cell-checkbox/ix-header-cell-checkbox.component';
import { IxTableHeadComponent } from 'app/modules/ix-table2/components/ix-table-head/ix-table-head.component';
import { IxTablePagerComponent } from 'app/modules/ix-table2/components/ix-table-pager/ix-table-pager.component';
import { IxTable2Component } from 'app/modules/ix-table2/components/ix-table2/ix-table2.component';
import { IxTableBodyCellDirective } from 'app/modules/ix-table2/directives/ix-body-cell.directive';
import { IxTableHeaderCellDirective } from 'app/modules/ix-table2/directives/ix-header-cell.directive';
import { IxTableCellDirective } from 'app/modules/ix-table2/directives/ix-table-cell.directive';
import { IxTableDetailsRowDirective } from 'app/modules/ix-table2/directives/ix-table-details-row.directive';
import { IxTable2EmptyDirective } from 'app/modules/ix-table2/directives/ix-table-empty.directive';
import { TestIdModule } from 'app/modules/test-id/test-id.module';

@NgModule({
  imports: [
    CommonModule,
    IxIconModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatTooltipModule,
    MatCheckboxModule,
    MatSelectModule,
    TranslateModule,
    TestIdModule,
    CoreComponents,
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
    IxBodyCellBaseComponent,
    IxBodyCellDateComponent,
    IxBodyCellSizeComponent,
    IxBodyCellCheckboxComponent,
    IxBodyCellYesNoComponent,
    IxBodyCellDeleteComponent,
    IxHeaderCellBaseComponent,
    IxHeaderCellCheckboxComponent,
    IxTable2EmptyDirective,
    IxTable2EmptyRowComponent,
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
    IxBodyCellBaseComponent,
    IxBodyCellDateComponent,
    IxBodyCellSizeComponent,
    IxBodyCellCheckboxComponent,
    IxBodyCellYesNoComponent,
    IxBodyCellDeleteComponent,
    IxHeaderCellBaseComponent,
    IxHeaderCellCheckboxComponent,
    IxTable2EmptyDirective,
    IxTable2EmptyRowComponent,
  ],
})
export class IxTable2Module {}
