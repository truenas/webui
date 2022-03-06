import { CdkTableModule } from '@angular/cdk/table';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { TranslateModule } from '@ngx-translate/core';
import { MaterialModule } from 'app/app-material.module';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxCheckboxColumnComponent } from 'app/modules/ix-tables/components/ix-checkbox-column/ix-checkbox-column.component';
import { IxExpandToggleColumnComponent } from 'app/modules/ix-tables/components/ix-expand-toggle-column/ix-expand-toggle-column.component';
import { IxTableExpandableRowComponent } from 'app/modules/ix-tables/components/ix-table-expandable-row/ix-table-expandable-row.component';
import { IxTablePaginatorComponent } from 'app/modules/ix-tables/components/ix-table-paginator/ix-table-paginator.component';
import { IxTableComponent } from 'app/modules/ix-tables/components/ix-table/ix-table.component';
import { IxCellDefDirective } from 'app/modules/ix-tables/directives/ix-cell-def.directive';
import { IxDetailRowDirective } from 'app/modules/ix-tables/directives/ix-detail-row.directive';
import { IxRowDefDirective } from 'app/modules/ix-tables/directives/ix-row-def.directive';
import { EmptyService } from 'app/modules/ix-tables/services/empty.service';

@NgModule({
  declarations: [
    IxTableComponent,
    IxRowDefDirective,
    IxCellDefDirective,
    IxDetailRowDirective,
    IxTablePaginatorComponent,
    IxTableExpandableRowComponent,
    IxExpandToggleColumnComponent,
    IxCheckboxColumnComponent,
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
    IxDetailRowDirective,
    IxTablePaginatorComponent,
    IxTableExpandableRowComponent,
    IxExpandToggleColumnComponent,
    IxCheckboxColumnComponent,
  ],
  providers: [
    EmptyService,
  ],
})
export class IxTableModule { }
