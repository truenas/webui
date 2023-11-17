import { BreakpointObserver, BreakpointState, Breakpoints } from '@angular/cdk/layout';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { toSvg } from 'jdenticon';
import { filter } from 'rxjs';
import { auditEventLabels } from 'app/enums/audit-event.enum';
import { getLogImportantData } from 'app/helpers/get-log-important-data.helper';
import { WINDOW } from 'app/helpers/window.helper';
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
export class AuditComponent implements OnInit, AfterViewInit, OnDestroy {
  protected dataProvider: ApiDataProvider<AuditEntry, 'audit.query'>;
  showMobileDetails = false;
  isMobileView = false;

  columns = createTable<AuditEntry>([
    textColumn({
      title: this.translate.instant('Service'),
      propertyName: 'service',
    }),
    textColumn({
      title: this.translate.instant('User'),
    }),
    dateColumn({
      title: this.translate.instant('Timestamp'),
      propertyName: 'timestamp',
    }),
    textColumn({
      title: this.translate.instant('Event'),
      getValue: (row) => this.translate.instant(auditEventLabels.get(row.event)),
    }),
    textColumn({
      title: this.translate.instant('Event Data'),
      getValue: (row) => this.translate.instant(this.getEventDataForLog(row)),
    }),
  ]);

  protected searchProperties = searchProperties<AuditEntry>([
    textProperty('audit_id', this.translate.instant('Audit ID')),
    textProperty('message_timestamp', this.translate.instant('Timestamp')),
    textProperty('address', this.translate.instant('Address')),
    textProperty('service', this.translate.instant('Service')),
    textProperty('username', this.translate.instant('Username')),
    textProperty('event', this.translate.instant('Event')),
    booleanProperty('success', this.translate.instant('Success')),
  ]);

  constructor(
    private translate: TranslateService,
    private ws: WebSocketService,
    protected emptyService: EmptyService,
    private breakpointObserver: BreakpointObserver,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer,
    @Inject(WINDOW) private window: Window,
  ) {}

  ngOnInit(): void {
    this.dataProvider = new ApiDataProvider(this.ws, 'audit.query');
    this.dataProvider.paginationStrategy = new PaginationServerSide();
    this.dataProvider.sortingStrategy = new SortingServerSide();

    this.dataProvider.currentPage$.pipe(filter(Boolean), untilDestroyed(this)).subscribe((auditEntries) => {
      this.dataProvider.expandedRow = auditEntries[0];
      this.expanded(this.dataProvider.expandedRow);
      this.cdr.markForCheck();
    });
  }

  ngAfterViewInit(): void {
    this.breakpointObserver
      .observe([Breakpoints.XSmall, Breakpoints.Small, Breakpoints.Medium])
      .pipe(untilDestroyed(this))
      .subscribe((state: BreakpointState) => {
        if (state.matches) {
          this.isMobileView = true;
          if (this.dataProvider.expandedRow) {
            this.expanded(this.dataProvider.expandedRow);
          } else {
            this.closeMobileDetails();
          }
        } else {
          this.isMobileView = false;
        }
        this.cdr.markForCheck();
      });
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
    this.dataProvider.expandedRow = null;
    this.cdr.markForCheck();
  }

  expanded(row: AuditEntry): void {
    if (!row) {
      return;
    }

    if (this.isMobileView) {
      this.showMobileDetails = true;

      // focus on details container
      setTimeout(() => (this.window.document.getElementsByClassName('mobile-back-button')[0] as HTMLElement).focus(), 0);
    }
  }

  getUserAvatarForLog(row: AuditEntry): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(toSvg(`${row.username}`, 35));
  }

  private getEventDataForLog(row: AuditEntry): string {
    return getLogImportantData(row);
  }
}
