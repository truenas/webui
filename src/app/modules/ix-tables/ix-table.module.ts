import { CdkTableModule } from '@angular/cdk/table';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxCheckboxColumnComponent } from 'app/modules/ix-tables/components/ix-checkbox-column/ix-checkbox-column.component';
import { IxExpandToggleColumnComponent } from 'app/modules/ix-tables/components/ix-expand-toggle-column/ix-expand-toggle-column.component';
import { IxTableExpandableRowComponent } from 'app/modules/ix-tables/components/ix-table-expandable-row/ix-table-expandable-row.component';
import { IxTablePaginatorComponent } from 'app/modules/ix-tables/components/ix-table-paginator/ix-table-paginator.component';
import { IxTableComponent } from 'app/modules/ix-tables/components/ix-table/ix-table.component';
import { IxCellDefDirective } from 'app/modules/ix-tables/directives/ix-cell-def.directive';
import { IxRowDefDirective } from 'app/modules/ix-tables/directives/ix-row-def.directive';
import { EmptyService } from 'app/modules/ix-tables/services/empty.service';

@NgModule({
  declarations: [
    IxTableComponent,
    IxRowDefDirective,
    IxCellDefDirective,
    IxTablePaginatorComponent,
    IxTableExpandableRowComponent,
    IxExpandToggleColumnComponent,
    IxCheckboxColumnComponent,
  ],
  imports: [
    CommonModule,
    EntityModule,
    FlexLayoutModule,
    MatPaginatorModule,
    MatDividerModule,
    MatIconModule,
    MatTooltipModule,
    MatCheckboxModule,
    TranslateModule,
    CdkTableModule,
    MatTableModule,
    MatButtonModule,
  ],
  exports: [
    IxTableComponent,
    IxRowDefDirective,
    IxCellDefDirective,
    IxTablePaginatorComponent,
    MatTableModule,
    IxTableExpandableRowComponent,
    IxExpandToggleColumnComponent,
    IxCheckboxColumnComponent,
    MatButtonModule,
  ],
  providers: [
    EmptyService,
  ],
})
export class IxTableModule { }
