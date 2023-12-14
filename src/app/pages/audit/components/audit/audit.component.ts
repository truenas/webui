import { BreakpointObserver, BreakpointState, Breakpoints } from '@angular/cdk/layout';
import {
  AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { toSvg } from 'jdenticon';
import { filter, map, of } from 'rxjs';
import {
  AuditEvent, AuditService, auditEventLabels, auditServiceLabels,
} from 'app/enums/audit-event.enum';
import { getLogImportantData } from 'app/helpers/get-log-important-data.helper';
import { ParamsBuilder } from 'app/helpers/params-builder/params-builder.class';
import { WINDOW } from 'app/helpers/window.helper';
import { AuditEntry, SmbAuditEntry } from 'app/interfaces/audit.interface';
import { CredentialType, credentialTypeLabels } from 'app/interfaces/credential-type.interface';
import { QueryFilters } from 'app/interfaces/query-api.interface';
import { ApiDataProvider } from 'app/modules/ix-table2/classes/api-data-provider/api-data-provider';
import { PaginationServerSide } from 'app/modules/ix-table2/classes/api-data-provider/pagination-server-side.class';
import { SortingServerSide } from 'app/modules/ix-table2/classes/api-data-provider/sorting-server-side.class';
import { dateColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-date/ix-cell-date.component';
import { textColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { TablePagination } from 'app/modules/ix-table2/interfaces/table-pagination.interface';
import { createTable } from 'app/modules/ix-table2/utils';
import { EmptyService } from 'app/modules/ix-tables/services/empty.service';
import { AdvancedSearchAutocompleteService } from 'app/modules/search-input/services/advanced-search-autocomplete.service';
import { SearchProperty } from 'app/modules/search-input/types/search-property.interface';
import {
  AdvancedSearchQuery,
  SearchQuery,
} from 'app/modules/search-input/types/search-query.interface';
import {
  dateProperty,
  searchProperties,
  textProperty,
} from 'app/modules/search-input/utils/search-properties.utils';
import { UrlOptionsService } from 'app/services/url-options.service';
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
  searchQuery: SearchQuery<AuditEntry>;
  pagination: TablePagination;

  get basicQueryFilters(): QueryFilters<AuditEntry> {
    return [['event', '~', `(?i)${(this.searchQuery as { query: string })?.query || ''}`]];
  }

  columns = createTable<AuditEntry>([
    textColumn({
      title: this.translate.instant('Service'),
      propertyName: 'service',
      getValue: (row) => (auditServiceLabels.has(row.service)
        ? this.translate.instant(auditServiceLabels.get(row.service))
        : row.event || '-'),
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
      getValue: (row) => (auditEventLabels.has(row.event)
        ? this.translate.instant(auditEventLabels.get(row.event))
        : row.event || '-'),
    }),
    textColumn({
      title: this.translate.instant('Event Data'),
      getValue: (row) => this.translate.instant(this.getEventDataForLog(row)),
    }),
  ], {
    rowTestId: (row: SmbAuditEntry) => 'smb-audit-' + row.audit_id.toString(),
  });

  protected searchProperties: SearchProperty<SmbAuditEntry>[] = [];

  constructor(
    private translate: TranslateService,
    private ws: WebSocketService,
    protected emptyService: EmptyService,
    private breakpointObserver: BreakpointObserver,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer,
    private activatedRoute: ActivatedRoute,
    private urlOptionsService: UrlOptionsService,
    private advancedSearchAutocomplete: AdvancedSearchAutocompleteService<never>,
    @Inject(WINDOW) private window: Window,
  ) {}

  ngOnInit(): void {
    this.dataProvider = new ApiDataProvider(this.ws, 'audit.query');
    this.dataProvider.paginationStrategy = new PaginationServerSide();
    this.dataProvider.sortingStrategy = new SortingServerSide();

    this.dataProvider.currentPage$.pipe(filter(Boolean), untilDestroyed(this)).subscribe((auditEntries) => {
      this.dataProvider.expandedRow = this.isMobileView ? null : auditEntries[0];
      this.expanded(this.dataProvider.expandedRow);

      this.searchProperties = searchProperties<AuditEntry>([
        textProperty('audit_id', this.translate.instant('ID'), of([])),
        dateProperty(
          'message_timestamp',
          this.translate.instant('Timestamp'),
        ),
        textProperty(
          'address',
          this.translate.instant('Address'),
          of(auditEntries.map((log) => ({
            label: log.address,
            value: `"${log.address}"`,
          }))),
        ),
        textProperty(
          'service',
          this.translate.instant('Service'),
          of(Object.values(AuditService).map((key) => ({
            label: this.translate.instant(auditServiceLabels.get(key)),
            value: `"${this.translate.instant(auditServiceLabels.get(key))}"`,
          }))),
          auditServiceLabels,
        ),
        textProperty(
          'username',
          this.translate.instant('Username'),
          this.ws.call('user.query').pipe((
            map((users) => users.map((user) => ({
              label: user.username,
              value: `"${user.username}"`,
            })))
          )),
        ),
        textProperty(
          'event',
          this.translate.instant('Event'),
          of(Object.values(AuditEvent).map((key) => ({
            label: this.translate.instant(auditEventLabels.get(key)),
            value: `"${this.translate.instant(auditEventLabels.get(key))}"`,
          }))),
          auditEventLabels,
        ),
        textProperty(
          'event_data.clientAccount',
          this.translate.instant('SMB - Client Account'),
          this.ws.call('user.query').pipe((
            map((users) => users.map((user) => ({
              label: user.username,
              value: `"${user.username}"`,
            })))
          )),
        ),
        textProperty('event_data.host', this.translate.instant('SMB - Host')),
        textProperty('event_data.file.path', this.translate.instant('SMB - File Path')),
        textProperty('event_data.src_file.path', this.translate.instant('SMB - Source File Path')),
        textProperty('event_data.dst_file.path', this.translate.instant('SMB - Destination File Path')),
        textProperty('event_data.file.handle.type', this.translate.instant('SMB - File Handle Type')),
        textProperty('event_data.file.handle.value', this.translate.instant('SMB - File Handle Value')),
        textProperty('event_data.unix_token.uid', this.translate.instant('SMB - UNIX Token UID')),
        textProperty('event_data.unix_token.gid', this.translate.instant('SMB - UNIX Token GID')),
        textProperty('event_data.unix_token.groups', this.translate.instant('SMB - UNIX Token Groups')),
        textProperty('event_data.result.type', this.translate.instant('SMB - Result Type')),
        textProperty('event_data.result.value_raw', this.translate.instant('SMB - Result Raw Value')),
        textProperty('event_data.result.value_parsed', this.translate.instant('SMB - Result Parsed Value')),
        textProperty(
          'event_data.vers.major',
          this.translate.instant('SMB - Vers Major'),
          of([{ label: '0', value: 0 }, { label: '1', value: 1 }]),
        ),
        textProperty(
          'event_data.vers.minor',
          this.translate.instant('SMB - Vers Minor'),
          of([{ label: '0', value: 0 }, { label: '1', value: 1 }]),
        ),
        textProperty('event_data.operations.create', this.translate.instant('SMB - Operation Create')),
        textProperty('event_data.operations.close', this.translate.instant('SMB - Operation Close')),
        textProperty('event_data.operations.read', this.translate.instant('SMB - Operation Read')),
        textProperty('event_data.operations.write', this.translate.instant('SMB - Operation Write')),
        textProperty(
          'event_data.credentials.credentials',
          this.translate.instant('Middleware - Credentials'),
          of(Object.values(CredentialType).map((key) => ({
            label: this.translate.instant(credentialTypeLabels.get(key)),
            value: `"${this.translate.instant(credentialTypeLabels.get(key))}"`,
          }))),
          credentialTypeLabels,
        ),
        textProperty('event_data.method', this.translate.instant('Middleware - Method')),
      ]);
      this.cdr.markForCheck();
    });

    this.dataProvider.controlsStateUpdated.pipe(untilDestroyed(this)).subscribe(() => {
      this.updateUrlOptions();
    });

    this.activatedRoute.params.pipe(untilDestroyed(this)).subscribe((params) => {
      const options = this.urlOptionsService.parseUrlOptions(params.options);

      this.pagination = {
        pageSize: options.pagination?.pageSize || 50,
        pageNumber: options.pagination?.pageNumber || 1,
      };

      if (options.sorting) this.dataProvider.setSorting(options.sorting);
      if (options.searchQuery) this.searchQuery = options.searchQuery as SearchQuery<AuditEntry>;

      this.onSearch(this.searchQuery);
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

  onSearch(query: SearchQuery<AuditEntry>): void {
    if (!query) {
      return;
    }

    this.searchQuery = query;

    if (query && query.isBasicQuery) {
      const term = `(?i)${query.query || ''}`;
      const params = new ParamsBuilder<AuditEntry>()
        .filter('event', '~', term)
        .orFilter('username', '~', term)
        .orFilter('service', '~', term)
        .getParams();

      this.dataProvider.setParams(params);
    }

    if (query && !query.isBasicQuery) {
      this.dataProvider.setParams([(query as AdvancedSearchQuery<AuditEntry>).filters]);
    }

    this.advancedSearchAutocomplete.showDatePicker$.next(false);

    this.dataProvider.load();
  }

  updateUrlOptions(): void {
    this.urlOptionsService.setUrlOptions('/system/audit', {
      searchQuery: this.searchQuery,
      sorting: this.dataProvider.sorting,
      pagination: this.dataProvider.pagination,
    });
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
    return getLogImportantData(row, this.translate);
  }
}
