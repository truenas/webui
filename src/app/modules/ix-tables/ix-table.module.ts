import { CdkTableModule } from '@angular/cdk/table';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { TranslateModule } from '@ngx-translate/core';
import { MaterialModule } from 'app/app-material.module';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxExpandToggleColumnComponent } from 'app/modules/ix-tables/components/ix-expand-toggle-column/ix-expand-toggle-column.component';
import { IxTableExpandableRowComponent } from 'app/modules/ix-tables/components/ix-table-expandable-row/ix-table-expandable-row.component';
import { IxTablePaginatorComponent } from 'app/modules/ix-tables/components/ix-table-paginator/ix-table-paginator.component';
import { IxTableComponent } from 'app/modules/ix-tables/components/ix-table/ix-table.component';
import { IxCellDefDirective } from 'app/modules/ix-tables/directives/ix-cell-def.directive';
import { IxRowDefDirective } from 'app/modules/ix-tables/directives/ix-row-def.directive';

@NgModule({
  declarations: [
    IxTableComponent,
    IxRowDefDirective,
    IxCellDefDirective,
    IxTablePaginatorComponent,
    IxTableExpandableRowComponent,
    IxExpandToggleColumnComponent,
  ],
  imports: [
    CommonModule,
    EntityModule,
    FlexLayoutModule,
    TranslateModule,
    CdkTableModule,
    MaterialModule,
  ],
  exports: [
    IxTableComponent,
    IxRowDefDirective,
    IxCellDefDirective,
    IxTablePaginatorComponent,
    IxTableExpandableRowComponent,
    IxExpandToggleColumnComponent,
  ],
})
export class IxTableModule { }
