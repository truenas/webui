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
  map, Observable, of, ReplaySubject, shareReplay, skip, switchMap, take,
} from 'rxjs';
import {
  AuditEvent, auditEventLabels, AuditService, auditServiceLabels,
} from 'app/enums/audit.enum';
import { ExportFormat } from 'app/enums/export-format.enum';
import { mapToOptions } from 'app/helpers/options.helper';
import { generateUuid } from 'app/helpers/uuid.helper';
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

// Cap user-supplied search input length to mitigate catastrophic regex
// backtracking from patterns like "a*a*a*…". Input beyond this is silently
// truncated before matching; 128 chars is far longer than any realistic
// event/username search term, so the truncation is not surfaced to the user.
const maxBasicSearchLength = 128;

// Short terms (e.g. a single letter) would match dozens of AuditEvent values
// and explode into a huge OR filter on the server — require enough characters
// for the match to be meaningful before treating the input as an event query.
const minBasicEventSearchLength = 3;

// Cap the number of matched events to keep the resulting OR filter bounded.
// Above this we fall back to a username search instead.
const maxBasicEventSearchMatches = 5;

// Mirrors tn-table-pager's own default page size; used only as the fallback
// when the URL carries no pagination of its own.
const defaultAuditPageSize = 50;
const defaultAuditPageNumber = 1;

// Anything that exposes a `username` we can turn into a typeahead suggestion —
// both `User` from `user.query` and `AuditEntry` from the current page qualify.
interface UsernameSource {
  username: string;
}

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
  protected advancedSearchPlaceholder = signal('');
  protected basicSearchPlaceholder = signal('');
  // Instance-scoped so the aria-labelledby relationship stays unique if this
  // component is ever rendered more than once on a page (e.g. tabbed views).
  protected readonly serviceLabelId = `audit-service-label-${generateUuid()}`;

  private readonly viewInitialized$ = new ReplaySubject<void>(1);

  private userSuggestions$ = this.api.call('user.query').pipe(
    map((users) => this.mapUsersForSuggestions(users)),
    take(1),
    shareReplay({ refCount: true, bufferSize: 1 }),
  );

  private apiAndLocalUserSuggestions(): Observable<Option[]> {
    return combineLatest([
      this.userSuggestions$,
      this.dataProvider().currentPage$.pipe(take(1), map((users) => this.mapUsersForSuggestions(users))),
    ]).pipe(
      map(([apiUsers, localUsers]) => [...apiUsers, ...localUsers]),
      // Shared so the username and client-account properties below subscribe to a
      // single combineLatest instead of each rebuilding their own.
      shareReplay({ refCount: true, bufferSize: 1 }),
    );
  }

  protected readonly basicQueryFilters = computed<QueryFilters<AuditEntry>>(() => {
    const query = this.searchQuery();
    if (!query?.isBasicQuery) {
      return [];
    }
    const searchTerm = query.query?.trim() || '';
    if (!searchTerm) {
      return [];
    }
    // A term made up entirely of wildcards (e.g. "*" or "**") would expand to a
    // `.*` regex run against every username. Treat it as "no filter" instead of
    // emitting a match-everything query.
    if (!searchTerm.replace(/\*/g, '').trim()) {
      return [];
    }
    const pattern = this.convertToRegexPattern(searchTerm);
    const matchedEvents = this.findMatchingEvents(searchTerm);

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

  // The enum values double as the display labels (CSV/JSON/YAML), so the menu can
  // render straight from this list — new formats appear without touching the template.
  protected readonly exportFormats = Object.values(ExportFormat);

  protected onFormatChange(format: ExportFormat): void {
    this.exportFormat.set(format);
  }

  ngOnInit(): void {
    this.refreshSearchPlaceholders();

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

    // Translated labels are cached eagerly in `staticSearchProperties`; rebuild
    // on language change so the suggestions reflect the active locale.
    this.translate.onLangChange
      .pipe(
        switchMap(() => this.dataProvider().currentPage$.pipe(take(1))),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((auditEntries) => {
        this.staticSearchProperties = null;
        this.refreshSearchPlaceholders();
        this.setSearchProperties(auditEntries ?? []);
      });

    // Wait for both URL params (resolved once) and view initialization (child
    // components ready), then apply the initial state and start reacting to
    // subsequent service changes. `viewInitialized$` is a ReplaySubject(1) that
    // emits once from `ngAfterViewInit`, so this subscription fires regardless
    // of subscription timing. skip(1) drops the current service value —
    // `applyInitialUrlOptions` already triggered the initial search.
    combineLatest([
      this.activatedRoute.params.pipe(take(1)),
      this.viewInitialized$,
    ]).pipe(
      switchMap(([params]) => {
        this.applyInitialUrlOptions(params.options as string);
        return this.serviceControl.value$.pipe(distinctUntilChanged(), skip(1));
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((service) => {
      this.dataProvider().service = service;
      this.updateUrlOptions();
      this.dataProvider().load();
    });
  }

  private applyInitialUrlOptions(rawOptions: string): void {
    const options = this.urlOptionsService.parseUrlOptions<AuditEntry>(
      rawOptions,
    ) as AuditUrlOptions<AuditEntry>;

    this.dataProvider().setPagination({
      pageSize: options.pagination?.pageSize || defaultAuditPageSize,
      pageNumber: options.pagination?.pageNumber || defaultAuditPageNumber,
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
  }

  private updateUrlOptions(): void {
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

  private onSearch(query: SearchQuery<AuditEntry>): void {
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

  private staticSearchProperties: {
    leading: SearchProperty<AuditEntry>[];
    trailing: SearchProperty<AuditEntry>[];
  } | null = null;

  /**
   * Builds the slice of search properties whose translated labels do not
   * depend on the current page of audit entries. Cached on first call to
   * avoid re-translating every event/credential label on each page change.
   *
   * Returns leading/trailing halves so `setSearchProperties` can splice in
   * page-dependent properties (`address`, user suggestions) without coupling
   * to magic indexes. The halves are returned as fresh arrays so callers can
   * destructure/splice them without mutating the cached source.
   */
  private getStaticSearchProperties(): {
    leading: SearchProperty<AuditEntry>[];
    trailing: SearchProperty<AuditEntry>[];
  } {
    if (this.staticSearchProperties) {
      return {
        leading: [...this.staticSearchProperties.leading],
        trailing: [...this.staticSearchProperties.trailing],
      };
    }

    this.staticSearchProperties = {
      leading: [
        textProperty('audit_id', this.translate.instant('ID'), of<Option[]>([])),
        dateProperty(
          'message_timestamp',
          this.translate.instant('Timestamp'),
        ),
      ],
      trailing: [
        textProperty(
          'event',
          this.translate.instant('Event'),
          of(Object.values(AuditEvent).map((key) => ({
            label: this.translate.instant(auditEventLabels.get(key) || key),
            value: `"${this.translate.instant(auditEventLabels.get(key) || key)}"`,
          }))),
          auditEventLabels,
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
      ],
    };

    return {
      leading: [...this.staticSearchProperties.leading],
      trailing: [...this.staticSearchProperties.trailing],
    };
  }

  private setSearchProperties(auditEntries: AuditEntry[]): void {
    // Page-dependent properties (address suggestions, user suggestions) are
    // rebuilt every call so they reflect the current page. The static halves
    // wrap them in the same order as the original list.
    const addressProperty = textProperty<AuditEntry>(
      'address',
      this.translate.instant('Address'),
      of(auditEntries.map((log) => ({
        label: log.address,
        value: `"${log.address}"`,
      }))),
    );

    const userSuggestions$ = this.apiAndLocalUserSuggestions();

    const usernameProperty = textProperty<AuditEntry>(
      'username',
      this.translate.instant('User'),
      userSuggestions$,
    );

    const clientAccountProperty = textProperty<AuditEntry>(
      'event_data.clientAccount',
      this.translate.instant('SMB - Client Account'),
      userSuggestions$,
    );

    const { leading, trailing } = this.getStaticSearchProperties();
    const [eventProperty, ...restTrailing] = trailing;

    this.searchProperties.set(searchProperties<AuditEntry>([
      ...leading,
      addressProperty,
      usernameProperty,
      eventProperty,
      clientAccountProperty,
      ...restTrailing,
    ]));
  }

  ngAfterViewInit(): void {
    // Signal that view and child components (including tn-table-pager) are initialized
    this.viewInitialized$.next();
    this.viewInitialized$.complete();
  }

  private refreshSearchPlaceholders(): void {
    this.advancedSearchPlaceholder.set(
      this.translate.instant("Event = 'Close' AND Username = 'admin'"),
    );
    this.basicSearchPlaceholder.set(this.translate.instant('Search by Event or Username'));
  }

  private mapUsersForSuggestions(users: UsernameSource[]): Option[] {
    return users.map((user) => ({
      label: user.username,
      value: `"${user.username}"`,
    }));
  }

  private convertToRegexPattern(term: string): string {
    const capped = term.slice(0, maxBasicSearchLength);
    // Escape all regex special characters except *
    const escaped = capped.replace(/[-/\\^$+?.()|[\]{}]/g, '\\$&');
    // Convert * to .* for wildcard support
    return escaped.replace(/\*/g, '.*');
  }

  /**
   * Finds AuditEvent values that match the user's basic search term using
   * a plain string scan (no regex). Treats spaces, hyphens, and underscores
   * as interchangeable separators and supports `*` as a wildcard that matches
   * zero or more characters between segments. Avoids the catastrophic-
   * backtracking exposure of `RegExp.test` against user-supplied patterns.
   */
  private findMatchingEvents(searchTerm: string): AuditEvent[] {
    if (searchTerm.replace(/\*/g, '').length < minBasicEventSearchLength) {
      return [];
    }

    const normalize = (value: string): string => value
      .slice(0, maxBasicSearchLength)
      .toLowerCase()
      .replace(/[\s\-_]+/g, '_');

    const normalizedTerm = normalize(searchTerm);
    const segments = normalizedTerm.split('*').filter(Boolean);
    if (segments.length === 0) {
      return [];
    }

    const matches = Object.values(AuditEvent).filter((eventValue) => {
      const normalizedEvent = normalize(eventValue);
      let cursor = 0;
      for (const segment of segments) {
        const idx = normalizedEvent.indexOf(segment, cursor);
        if (idx === -1) {
          return false;
        }
        cursor = idx + segment.length;
      }
      return true;
    });

    // Too many matches likely mean the term was too generic; fall back to
    // username search rather than emitting an unbounded OR filter.
    if (matches.length > maxBasicEventSearchMatches) {
      return [];
    }
    return matches;
  }
}
