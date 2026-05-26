import { AsyncPipe } from '@angular/common';
import { AfterViewInit, Component, OnInit, ChangeDetectionStrategy, DestroyRef, input, computed, signal, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { FormControl } from '@ngneat/reactive-forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnButtonComponent,
  TnIconButtonComponent,
  TnMenuComponent,
  TnMenuItemComponent,
  TnMenuTriggerDirective,
  TnSelectComponent,
} from '@truenas/ui-components';
import {
  combineLatest,
  distinctUntilChanged,
  filter,
  map, Observable, of, ReplaySubject, shareReplay, skip, switchMap, take, tap,
} from 'rxjs';
import {
  AuditEvent, auditEventLabels, AuditService, auditServiceLabels,
} from 'app/enums/audit.enum';
import { ExportFormat } from 'app/enums/export-format.enum';
import { mapToOptions } from 'app/helpers/options.helper';
import { AuditEntry } from 'app/interfaces/audit/audit.interface';
import { CredentialType, credentialTypeLabels } from 'app/interfaces/credential-type.interface';
import { Option } from 'app/interfaces/option.interface';
import { QueryFilters } from 'app/interfaces/query-api.interface';
import { ExportButtonComponent } from 'app/modules/buttons/export-button/export-button.component';
import { SearchInputComponent } from 'app/modules/forms/search-input/components/search-input/search-input.component';
import { SearchProperty } from 'app/modules/forms/search-input/types/search-property.interface';
import { AdvancedSearchQuery, SearchQuery } from 'app/modules/forms/search-input/types/search-query.interface';
import { dateProperty, searchProperties, textProperty } from 'app/modules/forms/search-input/utils/search-properties.utils';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { AuditApiDataProvider } from 'app/pages/audit/utils/audit-api-data-provider';
import { AuditUrlOptions, UrlOptionsService } from 'app/services/url-options.service';

const maxBasicSearchLength = 128;

@Component({
  selector: 'ix-audit-search',
  templateUrl: './audit-search.component.html',
  styleUrls: ['./audit-search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    FakeProgressBarComponent,
    SearchInputComponent,
    TranslateModule,
    ExportButtonComponent,
    TnButtonComponent,
    TnIconButtonComponent,
    TnMenuComponent,
    TnMenuItemComponent,
    TnMenuTriggerDirective,
    TnSelectComponent,
    TestDirective,
    ReactiveFormsModule,
  ],
})
export class AuditSearchComponent implements OnInit, AfterViewInit {
  private api = inject(ApiService);
  private activatedRoute = inject(ActivatedRoute);
  private urlOptionsService = inject(UrlOptionsService);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  readonly dataProvider = input.required<AuditApiDataProvider>();

  protected readonly searchQuery = signal<SearchQuery<AuditEntry>>({ query: '', isBasicQuery: true });
  protected readonly searchProperties = signal<SearchProperty<AuditEntry>[]>([]);
  protected readonly serviceControl = new FormControl<AuditService>(AuditService.Middleware);
  protected readonly serviceOptions = mapToOptions(auditServiceLabels, this.translate);
  protected readonly exportFormat = signal<ExportFormat>(ExportFormat.Csv);

  private readonly viewInitialized$ = new ReplaySubject<void>(1);

  private userSuggestions$ = this.api.call('user.query').pipe(
    map((users) => this.mapUsersForSuggestions(users)),
    take(1),
    shareReplay({ refCount: true, bufferSize: 1 }),
  );

  private apiAndLocalUserSuggestions$ = computed<Observable<Option[]>>(() => {
    return combineLatest([
      this.userSuggestions$,
      this.dataProvider().currentPage$.pipe(take(1), map((users) => this.mapUsersForSuggestions(users))),
    ]).pipe(
      map(([apiUsers, localUsers]) => [...apiUsers, ...localUsers]),
    );
  });

  basicQueryFilters = computed<QueryFilters<AuditEntry>>(() => {
    const searchTerm = (this.searchQuery() as { query: string })?.query?.trim() || '';
    if (!searchTerm) {
      return [];
    }
    const pattern = this.convertToRegexPattern(searchTerm);
    const eventPattern = pattern.replace(/\s+/g, '_').toUpperCase().replace(/_/g, '[_-]');

    let eventRegex: RegExp;
    try {
      eventRegex = new RegExp(eventPattern, 'i');
    } catch {
      return [['username', '~', pattern]] as QueryFilters<AuditEntry>;
    }

    const matchedEvents = Object.values(AuditEvent).filter((eventValue) => eventRegex.test(eventValue));

    if (matchedEvents.length === 1) {
      return [['event', '~', matchedEvents[0]]] as QueryFilters<AuditEntry>;
    }

    if (matchedEvents.length > 1) {
      return [
        ['OR', matchedEvents.map((event) => [['event', '~', event]])],
      ] as QueryFilters<AuditEntry>;
    }

    return [['username', '~', pattern]] as QueryFilters<AuditEntry>;
  });

  protected readonly exportFilename = computed(() => {
    const format = this.exportFormat().toLowerCase();
    return `audit_report.${format}`;
  });

  // The backend always returns a gzipped tarball (.tgz) regardless of the selected format —
  // the format selection only changes the content inside the archive.
  protected readonly exportFileType = 'tgz';
  protected readonly exportMimeType = 'application/gzip';

  protected readonly exportFormatDisplayLabel = computed(() => this.exportFormat().toUpperCase());

  protected readonly ExportFormat = ExportFormat;

  /**
   * Coordinates initialization flow:
   * 1. Load URL params (pagination, sorting, search query, service)
   * 2. Wait for view initialization (ensures child components are ready)
   * 3. Perform initial search with loaded params, then react to subsequent service changes
   *
   * `viewInitialized$` is a ReplaySubject(1) that emits exactly once from `ngAfterViewInit`
   * and then completes, so subscribers see the emission regardless of subscription order.
   */
  private readonly initialization$ = combineLatest([
    this.activatedRoute.params.pipe(take(1)),
    this.viewInitialized$,
  ]).pipe(
    tap(([params]) => {
      const options = this.urlOptionsService.parseUrlOptions<AuditEntry>(
        params.options as string,
      ) as AuditUrlOptions<AuditEntry>;

      this.dataProvider().setPagination({
        pageSize: options.pagination?.pageSize || 50,
        pageNumber: options.pagination?.pageNumber || 1,
      }, true);

      if (options.sorting) {
        this.dataProvider().setSorting(options.sorting, true);
      }

      if (options.searchQuery) {
        this.searchQuery.set(options.searchQuery as SearchQuery<AuditEntry>);
      }

      if (options.service) {
        this.serviceControl.setValue(options.service);
      }

      this.dataProvider().service = this.serviceControl.value;
      this.onSearch(this.searchQuery());
    }),
  );

  onFormatChange(format: ExportFormat): void {
    this.exportFormat.set(format);
  }

  ngOnInit(): void {
    this.dataProvider().sortingOrPaginationUpdate
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.updateUrlOptions();
      });

    this.dataProvider().currentPage$
      .pipe(filter(Boolean), takeUntilDestroyed(this.destroyRef))
      .subscribe((auditEntries) => {
        this.setSearchProperties(auditEntries);
      });

    // Run initialization once, then react to subsequent service changes.
    // skip(1) drops the current value — the initialization tap already applied it.
    this.initialization$.pipe(
      switchMap(() => this.serviceControl.value$.pipe(distinctUntilChanged(), skip(1))),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((service) => {
      this.dataProvider().service = service;
      this.updateUrlOptions();
      this.dataProvider().load();
    });
  }

  updateUrlOptions(): void {
    this.urlOptionsService.setUrlOptions('/system/audit', {
      searchQuery: this.searchQuery(),
      sorting: this.dataProvider().sorting,
      pagination: this.dataProvider().pagination,
      service: this.serviceControl.value,
    } as AuditUrlOptions<AuditEntry>);
  }

  protected runSearchFromInput(searchInput: SearchInputComponent<AuditEntry>): void {
    this.onSearch(searchInput.query());
    searchInput.advancedSearch()?.hideDatePicker();
  }

  onSearch(query: SearchQuery<AuditEntry>): void {
    if (!query) {
      return;
    }

    this.searchQuery.set(query);

    if (query?.isBasicQuery) {
      // Use the computed basicQueryFilters instead of duplicating the logic
      this.dataProvider().setQueryFilters(this.basicQueryFilters());
    }

    if (query && !query.isBasicQuery) {
      this.dataProvider().setQueryFilters(
        (query as AdvancedSearchQuery<AuditEntry>).filters as QueryFilters<AuditEntry>,
      );
    }

    this.updateUrlOptions();
    this.dataProvider().load();
  }

  private setSearchProperties(auditEntries: AuditEntry[]): void {
    this.searchProperties.update(() => searchProperties<AuditEntry>([
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
        'username',
        this.translate.instant('User'),
        this.apiAndLocalUserSuggestions$(),
      ),
      textProperty(
        'event',
        this.translate.instant('Event'),
        of(Object.values(AuditEvent).map((key) => ({
          label: this.translate.instant(auditEventLabels.get(key) || key),
          value: `"${this.translate.instant(auditEventLabels.get(key) || key)}"`,
        }))),
        auditEventLabels,
      ),
      textProperty(
        'event_data.clientAccount',
        this.translate.instant('SMB - Client Account'),
        this.apiAndLocalUserSuggestions$(),
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
          label: this.translate.instant(credentialTypeLabels.get(key) || key),
          value: `"${this.translate.instant(credentialTypeLabels.get(key) || key)}"`,
        }))),
        credentialTypeLabels,
      ),
      textProperty('event_data.method', this.translate.instant('Middleware - Method')),
    ]));
  }

  ngAfterViewInit(): void {
    // Signal that view and child components (including ix-table-pager) are initialized
    this.viewInitialized$.next();
    this.viewInitialized$.complete();
  }

  private mapUsersForSuggestions(users: { username: string }[]): Option[] {
    return users.map((user) => ({
      label: user.username,
      value: `"${user.username}"`,
    }));
  }

  private convertToRegexPattern(term: string): string {
    // Cap input length to mitigate catastrophic backtracking from patterns like "a*a*a*…".
    const capped = term.slice(0, maxBasicSearchLength);
    // Escape all regex special characters except *
    const escaped = capped.replace(/[-/\\^$+?.()|[\]{}]/g, '\\$&');
    // Convert * to .* for wildcard support
    return escaped.replace(/\*/g, '.*');
  }
}
