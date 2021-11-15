import { CdkTableModule } from '@angular/cdk/table';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { TranslateModule } from '@ngx-translate/core';
import { MaterialModule } from 'app/app-material.module';
import { EntityModule } from 'app/pages/common/entity/entity.module';
import { IxTableComponent } from 'app/pages/common/ix-tables/components/ix-table/ix-table.component';
import { IxCellDefDirective } from 'app/pages/common/ix-tables/directives/ix-cell-def.directive';
import { IxTableColumnComponent } from './components/ix-table-column/ix-table-column.component';
import { IxTablePaginatorComponent } from './components/ix-table-paginator/ix-table-paginator.component';

@NgModule({
  declarations: [
    IxTableComponent,
    IxCellDefDirective,
    IxTablePaginatorComponent,
    IxTableColumnComponent,
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
    IxCellDefDirective,
    IxTablePaginatorComponent,
    IxTableColumnComponent,
  ],
})
export class IxTableModule { }
