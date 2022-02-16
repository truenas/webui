import {
  AfterContentInit, Component, ContentChildren, Input, QueryList, ViewChild,
} from '@angular/core';
import { MatColumnDef, MatTableDataSource } from '@angular/material/table';
import { TranslateService } from '@ngx-translate/core';
import { EmptyConfig, EmptyType } from 'app/modules/entity/entity-empty/entity-empty.component';
import { IxTableComponent } from 'app/modules/ix-tables/components/ix-table/ix-table.component';
import { IxTableStatus } from 'app/modules/ix-tables/enums/ix-table-status.enum';

@Component({
  selector: 'ix-table-extended',
  templateUrl: 'ix-table-extended.component.html',
})
export class IxTableExtendedComponent implements AfterContentInit {
  @Input() dataSource: MatTableDataSource<unknown> = new MatTableDataSource([]);
  @Input() displayedColumns: string[];
  @Input() status: IxTableStatus;
  @Input() title = '';

  loadingConf: EmptyConfig = {
    type: EmptyType.Loading,
    large: false,
    title: this.translate.instant('Loading...'),
  };

  emptyConf: EmptyConfig = {
    type: EmptyType.NoPageData,
    large: true,
    title: this.translate.instant('No {title} have been added yet', { title: this.title ? this.title : 'items' }),
  };

  errorConf: EmptyConfig = {
    type: EmptyType.Errors,
    large: true,
    title: this.translate.instant('Can not retrieve response'),
  };

  @ViewChild(IxTableComponent, { static: true }) table: IxTableComponent<unknown>;
  @ContentChildren(MatColumnDef) columnDefs: QueryList<MatColumnDef>;

  ngAfterContentInit(): void {
    this.columnDefs.forEach((columnDef) => this.table.addColumnDef(columnDef));
  }

  get currentEmptyConf(): EmptyConfig {
    switch (this.status) {
      case IxTableStatus.Loading:
        return this.loadingConf;
        break;
      case IxTableStatus.Error:
        return this.errorConf;
        break;
      default:
        return this.emptyConf;
        break;
    }
  }

  constructor(private translate: TranslateService) {}
}
