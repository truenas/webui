import { BreakpointObserver, BreakpointState, Breakpoints } from '@angular/cdk/layout';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { toSvg } from 'jdenticon';
import {
  Observable,
  combineLatest,
  filter, map, of, shareReplay, take,
} from 'rxjs';
import {
  AuditEvent, AuditService, auditEventLabels, auditServiceLabels,
} from 'app/enums/audit.enum';
import { ParamsBuilder } from 'app/helpers/params-builder/params-builder.class';
import { WINDOW } from 'app/helpers/window.helper';
import { AuditEntry, AuditQueryParams } from 'app/interfaces/audit/audit.interface';
import { CredentialType, credentialTypeLabels } from 'app/interfaces/credential-type.interface';
import { Option } from 'app/interfaces/option.interface';
import { QueryFilters } from 'app/interfaces/query-api.interface';
import { User } from 'app/interfaces/user.interface';
import { EmptyService } from 'app/modules/empty/empty.service';
import { AuditApiDataProvider } from 'app/modules/ix-table/classes/api-data-provider/audit-api-data-provider';
import { PaginationServerSide } from 'app/modules/ix-table/classes/api-data-provider/pagination-server-side.class';
import { SortingServerSide } from 'app/modules/ix-table/classes/api-data-provider/sorting-server-side.class';
import { dateColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-date/ix-cell-date.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { TablePagination } from 'app/modules/ix-table/interfaces/table-pagination.interface';
import { createTable } from 'app/modules/ix-table/utils';
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
import { auditElements } from 'app/pages/audit/components/audit/audit.elements';
import { getLogImportantData } from 'app/pages/audit/utils/get-log-important-data.utils';
import { UrlOptionsService } from 'app/services/url-options.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-audit',
  templateUrl: './audit.component.html',
  styleUrls: ['./audit.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditComponent implements OnInit, OnDestroy {
  protected readonly searchableElements = auditElements;

  protected dataProvider: AuditApiDataProvider;
  protected readonly advancedSearchPlaceholder = this.translate.instant('Service = "SMB" AND Event = "CLOSE"');
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
        : row.service || '-'),
    }),
    textColumn({
      title: this.translate.instant('User'),
    }),
    dateColumn({
      title: this.translate.instant('Timestamp'),
      propertyName: 'message_timestamp',
      getValue: (row) => row.message_timestamp * 1000,
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
    rowTestId: (row) => 'audit-' + row.service + '-' + row.username + '-' + row.event,
  });

  protected searchProperties: SearchProperty<AuditEntry>[] = [];

  private userSuggestions$ = this.ws.call('user.query').pipe(
    map((users) => this.mapUsersForSuggestions(users)),
    take(1),
    shareReplay({ refCount: true, bufferSize: 1 }),
  );

  private apiAndLocalUserSuggestions$: Observable<Option[]>;

  constructor(
    private translate: TranslateService,
    private ws: WebSocketService,
    protected emptyService: EmptyService,
    private breakpointObserver: BreakpointObserver,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer,
    private activatedRoute: ActivatedRoute,
    private urlOptionsService: UrlOptionsService,
    @Inject(WINDOW) private window: Window,
  ) {}

  ngOnInit(): void {
    this.dataProvider = new AuditApiDataProvider(this.ws);
    this.dataProvider.paginationStrategy = new PaginationServerSide();
    this.dataProvider.sortingStrategy = new SortingServerSide();
    this.setDefaultSort();

    this.getAuditLogs();

    this.apiAndLocalUserSuggestions$ = combineLatest(
      this.userSuggestions$,
      this.dataProvider.currentPage$.pipe(take(1), map((users) => this.mapUsersForSuggestions(users))),
    ).pipe(
      map(([apiUsers, localUsers]) => [...apiUsers, ...localUsers]),
    );

    this.dataProvider.currentPage$.pipe(filter(Boolean), untilDestroyed(this)).subscribe((auditEntries) => {
      this.dataProvider.expandedRow = this.isMobileView ? null : auditEntries[0];
      this.expanded(this.dataProvider.expandedRow);

      this.setSearchProperties(auditEntries);
      this.cdr.markForCheck();
    });

    this.dataProvider.controlsStateUpdated.pipe(untilDestroyed(this)).subscribe(() => {
      this.updateUrlOptions();
    });

    this.loadParamsFromRoute();
    this.initMobileView();
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

      // TODO: Incorrect cast, because of incorrect typing inside of DataProvider
      this.dataProvider.setParams(params as unknown as [AuditQueryParams]);
    }

    if (query && !query.isBasicQuery) {
      // TODO: Incorrect cast, because of incorrect typing inside of DataProvider
      this.dataProvider.setParams(
        [(query as AdvancedSearchQuery<AuditEntry>).filters] as unknown as [AuditQueryParams],
      );
    }

    this.getAuditLogs();
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
      this.cdr.markForCheck();

      // TODO: Do not rely on querying DOM elements
      // focus on details container
      setTimeout(() => (this.window.document.getElementsByClassName('mobile-back-button')[0] as HTMLElement).focus(), 0);
    }
  }

  getUserAvatarForLog(row: AuditEntry): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(toSvg(row.username, this.isMobileView ? 15 : 35));
  }

  private initMobileView(): void {
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

  private setSearchProperties(auditEntries: AuditEntry[]): void {
    this.searchProperties = searchProperties<AuditEntry>([
      textProperty('audit_id', this.translate.instant('ID'), of<Option[]>([])),
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
        this.translate.instant('User'),
        this.apiAndLocalUserSuggestions$,
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
        this.apiAndLocalUserSuggestions$,
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
  }

  private loadParamsFromRoute(): void {
    this.activatedRoute.params.pipe(untilDestroyed(this)).subscribe((params) => {
      const options = this.urlOptionsService.parseUrlOptions(params.options as string);

      this.pagination = {
        pageSize: options.pagination?.pageSize || 50,
        pageNumber: options.pagination?.pageNumber || 1,
      };

      if (options.sorting) this.dataProvider.setSorting(options.sorting);

      if (options.searchQuery) this.searchQuery = options.searchQuery as SearchQuery<AuditEntry>;

      this.onSearch(this.searchQuery);
    });
  }

  private getEventDataForLog(row: AuditEntry): string {
    return getLogImportantData(row, this.translate);
  }

  private setDefaultSort(): void {
    this.dataProvider.setSorting({
      propertyName: 'message_timestamp',
      direction: SortDirection.Desc,
      active: 1,
    });
  }

  private mapUsersForSuggestions(users: User[] | AuditEntry[]): Option[] {
    return users.map((user) => ({
      label: user.username,
      value: `"${user.username}"`,
    }));
  }

  private getAuditLogs(): void {
    this.dataProvider.load();
  }
}
