import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { AuditEntry } from 'app/interfaces/audit.interface';
import { ApiDataProvider, PaginationServerSide, SortingServerSide } from 'app/modules/ix-table2/api-data-provider';
import { dateColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-date/ix-cell-date.component';
import { textColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { createTable } from 'app/modules/ix-table2/utils';
import { EmptyService } from 'app/modules/ix-tables/services/empty.service';
import { ManageViewsComponent } from 'app/pages/audit/components/manage-views/manage-views.component';
import { SetupColumnsComponent } from 'app/pages/audit/components/setup-columns/setup-columns.component';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-audit',
  templateUrl: './audit.component.html',
  styleUrls: ['./audit.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditComponent implements OnInit, OnDestroy {
  protected readonly searchControl = new FormControl();
  protected dataProvider: ApiDataProvider<AuditEntry>;
  columns = createTable<AuditEntry>([
    dateColumn({
      title: this.translate.instant('Event Time'),
      propertyName: 'timestamp',
    }),
    textColumn({
      title: this.translate.instant('Event'),
      propertyName: 'event',
    }),
    textColumn({
      title: this.translate.instant('Address'),
      propertyName: 'address',
    }),
    textColumn({
      title: this.translate.instant('Username'),
      propertyName: 'username',
      sortable: true,
    }),
  ]);

  auditEntries: AuditEntry[] = [];

  constructor(
    private matDialog: MatDialog,
    private translate: TranslateService,
    private ws: WebSocketService,
    protected emptyService: EmptyService,
  ) {}

  ngOnInit(): void {
    this.dataProvider = new ApiDataProvider<AuditEntry>(this.ws, 'audit.query');
    this.dataProvider.paginationStrategy = new PaginationServerSide();
    this.dataProvider.sortingStrategy = new SortingServerSide();

    this.dataProvider.currentPage$.pipe(untilDestroyed(this)).subscribe((auditEntries) => {
      this.auditEntries = auditEntries;
    });
  }

  ngOnDestroy(): void {
    this.dataProvider.unsubscribe();
  }

  onManageViewsPressed(): void {
    this.matDialog.open(ManageViewsComponent);
  }

  onExport(): void {

  }

  onSetupColumns(): void {
    this.matDialog.open(SetupColumnsComponent);
  }
}
