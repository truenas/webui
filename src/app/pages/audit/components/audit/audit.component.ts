import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { AuditEntry } from 'app/interfaces/audit.interface';
import { ApiDataProvider, PaginationServerSide, SortingServerSide } from 'app/modules/ix-table2/api-data-provider';
import { dateColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-date/ix-cell-date.component';
import { textColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { createTable } from 'app/modules/ix-table2/utils';
import { EmptyService } from 'app/modules/ix-tables/services/empty.service';
import {
  booleanProperty,
  searchProperties,
  textProperty,
} from 'app/modules/search-input/utils/search-properties.constants';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-audit',
  templateUrl: './audit.component.html',
  styleUrls: ['./audit.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditComponent implements OnInit, OnDestroy {
  protected dataProvider: ApiDataProvider<AuditEntry>;
  showMobileDetails = false;
  columns = createTable<AuditEntry>([
    textColumn({
      title: this.translate.instant('Service'),
      propertyName: 'service',
    }),
    textColumn({
      title: this.translate.instant('User'),
      propertyName: 'username',
    }),
    dateColumn({
      title: this.translate.instant('Timestamp'),
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
  ]);

  auditEntries: AuditEntry[] = [];

  protected searchProperties = searchProperties<AuditEntry>([
    textProperty('audit_id', this.translate.instant('Audit ID')),
    textProperty('message_timestamp', this.translate.instant('Timestamp')),
    textProperty('address', this.translate.instant('Address')),
    textProperty('username', this.translate.instant('Username')),
    textProperty('event', this.translate.instant('Event')),
    booleanProperty('success', this.translate.instant('Success')),
  ]);

  constructor(
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

  onSearch(): void {

  }

  closeMobileDetails(): void {
    this.showMobileDetails = false;
  }
}
