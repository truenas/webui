import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { TranslateModule } from '@ngx-translate/core';
import { MaterialModule } from 'app/app-material.module';
import { EntityModule } from 'app/pages/common/entity/entity.module';
import { IxTablePaginatorComponent } from './components/ix-table-paginator/ix-table-paginator.component';
import { IxTableToolbarComponent } from './components/ix-table-toolbar/ix-table-toolbar.component';
import { IxTableComponent } from './components/ix-table/ix-table.component';
import { TypedMatCellDefDirective } from './directives/typed-mat-cell-def.directive';

@NgModule({
  declarations: [
    IxTableComponent,
    TypedMatCellDefDirective,
    IxTableToolbarComponent,
    IxTablePaginatorComponent,
  ],
  imports: [
    CommonModule,
    EntityModule,
    MaterialModule,
    FlexLayoutModule,
    TranslateModule,
  ],
  exports: [
    IxTableComponent,
    TypedMatCellDefDirective,
    IxTableToolbarComponent,
    IxTablePaginatorComponent,
  ],
})
export class IxTablesModule { }
