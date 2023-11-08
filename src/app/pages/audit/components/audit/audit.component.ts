import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { AuditEntry } from 'app/interfaces/audit.interface';
import { ApiDataProvider, PaginationServerSide, SortingServerSide } from 'app/modules/ix-table2/api-data-provider';
import { dateColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-date/ix-cell-date.component';
import { textColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { createTable } from 'app/modules/ix-table2/utils';
import { EmptyService } from 'app/modules/ix-tables/services/empty.service';
import {
  AdvancedSearchQuery,
  SearchQuery,
} from 'app/modules/search-input/types/search-query.interface';
import {
  booleanProperty,
  searchProperties,
  textProperty,
} from 'app/modules/search-input/utils/search-properties.utils';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-audit',
  templateUrl: './audit.component.html',
  styleUrls: ['./audit.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditComponent implements OnInit, OnDestroy {
  protected dataProvider: ApiDataProvider<AuditEntry, 'audit.query'>;
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
    this.dataProvider = new ApiDataProvider(this.ws, 'audit.query');
    this.dataProvider.paginationStrategy = new PaginationServerSide();
    this.dataProvider.sortingStrategy = new SortingServerSide();
  }

  ngOnDestroy(): void {
    this.dataProvider.unsubscribe();
  }

  // TODO: Issue: reset icon will not trigger table update
  onSearch(query: SearchQuery<AuditEntry>): void {
    if (query.isBasicQuery) {
      // TODO: Create a separate class to handle this.
      this.dataProvider.setParams([[['event', '~', query.query]]]);
    } else {
      this.dataProvider.setParams([(query as AdvancedSearchQuery<AuditEntry>).filters]);
    }

    this.dataProvider.load();
  }

  closeMobileDetails(): void {
    this.showMobileDetails = false;
  }
}
