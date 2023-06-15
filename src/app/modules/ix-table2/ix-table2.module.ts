import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { IxTableBodyComponent } from 'app/modules/ix-table2/components/ix-table-body/ix-table-body.component';
import { IxTableHeadComponent } from 'app/modules/ix-table2/components/ix-table-head/ix-table-head.component';
import { IxTablePagerComponent } from 'app/modules/ix-table2/components/ix-table-pager/ix-table-pager.component';
import { IxTable2Component } from 'app/modules/ix-table2/components/ix-table2/ix-table2.component';
import { IxTableDetailsRowDirective } from 'app/modules/ix-table2/directives/ix-table-details-row.directive';
import { IxTableRowDirective } from 'app/modules/ix-table2/directives/ix-table-row.directive';

@NgModule({
  imports: [
    CommonModule,
    IxIconModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatTooltipModule,
    TranslateModule,
  ],
  declarations: [
    IxTable2Component,
    IxTableHeadComponent,
    IxTableBodyComponent,
    IxTablePagerComponent,
    IxTableRowDirective,
    IxTableDetailsRowDirective,
  ],
  exports: [
    IxTable2Component,
    IxTableHeadComponent,
    IxTableBodyComponent,
    IxTablePagerComponent,
    IxTableRowDirective,
    IxTableDetailsRowDirective,
  ],
})
export class IxTable2Module {}
