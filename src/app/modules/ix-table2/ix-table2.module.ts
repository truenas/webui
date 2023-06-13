import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { IxTableBodyComponent } from 'app/modules/ix-table2/components/ix-table-body/ix-table-body.component';
import { IxTableHeadComponent } from 'app/modules/ix-table2/components/ix-table-head/ix-table-head.component';
import { IxTable2Component } from 'app/modules/ix-table2/components/ix-table2/ix-table2.component';
import { IxTableRowDirective } from 'app/modules/ix-table2/directives/ix-table-row.directive';

@NgModule({
  imports: [CommonModule],
  declarations: [
    IxTable2Component,
    IxTableHeadComponent,
    IxTableBodyComponent,
    IxTableRowDirective,
  ],
  exports: [
    IxTable2Component,
    IxTableHeadComponent,
    IxTableBodyComponent,
    IxTableRowDirective,
  ],
})
export class IxTable2Module {}
