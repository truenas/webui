import { AsyncPipe, NgTemplateOutlet } from '@angular/common';
import {
  Component, OnInit, ChangeDetectionStrategy, input,
  computed,
  signal,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  combineLatest,
  filter,
  map, Observable, of, shareReplay, take,
} from 'rxjs';
import {
  AuditService, auditServiceLabels, AuditEvent, auditEventLabels,
} from 'app/enums/audit.enum';
import { ParamsBuilder } from 'app/helpers/params-builder/params-builder.class';
import { AuditEntry, AuditQueryParams } from 'app/interfaces/audit/audit.interface';
import { CredentialType, credentialTypeLabels } from 'app/interfaces/credential-type.interface';
import { Option } from 'app/interfaces/option.interface';
import { QueryFilters } from 'app/interfaces/query-api.interface';
import { User } from 'app/interfaces/user.interface';
import { ExportButtonComponent } from 'app/modules/buttons/export-button/export-button.component';
import { SearchInputComponent } from 'app/modules/forms/search-input/components/search-input/search-input.component';
import { SearchProperty } from 'app/modules/forms/search-input/types/search-property.interface';
import { AdvancedSearchQuery, SearchQuery } from 'app/modules/forms/search-input/types/search-query.interface';
import { dateProperty, searchProperties, textProperty } from 'app/modules/forms/search-input/utils/search-properties.utils';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { AuditApiDataProvider } from 'app/pages/audit/utils/audit-api-data-provider';
import { UrlOptionsService } from 'app/services/url-options.service';

@UntilDestroy()
@Component({
  selector: 'ix-audit-search',
  templateUrl: './audit-search.component.html',
  styleUrls: ['./audit-search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    AsyncPipe,
    FakeProgressBarComponent,
    MatButton,
    NgTemplateOutlet,
    SearchInputComponent,
    TranslateModule,
    ExportButtonComponent,
  ],
})
export class AuditSearchComponent implements OnInit {
  readonly dataProvider = input.required<AuditApiDataProvider>();
  readonly isMobileView = input.required<boolean>();

  protected readonly searchQuery = signal<SearchQuery<AuditEntry>>({ query: '', isBasicQuery: true });
  protected readonly searchProperties = signal<SearchProperty<AuditEntry>[]>([]);
  protected readonly advancedSearchPlaceholder = this.translate.instant('Service = "SMB" AND Event = "CLOSE"');

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
    return [['event', '~', `(?i)${(this.searchQuery() as { query: string })?.query || ''}`]];
  });

  constructor(
    private api: ApiService,
    private activatedRoute: ActivatedRoute,
    private urlOptionsService: UrlOptionsService,
    private translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.loadParamsFromRoute();

    this.dataProvider().controlsStateUpdated
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.updateUrlOptions();
      });

    this.dataProvider().currentPage$
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe((auditEntries) => {
        this.setSearchProperties(auditEntries);
      });
  }

  updateUrlOptions(): void {
    this.urlOptionsService.setUrlOptions('/system/audit', {
      searchQuery: this.searchQuery(),
      sorting: this.dataProvider().sorting,
      pagination: this.dataProvider().pagination,
    });
  }

  onSearch(query: SearchQuery<AuditEntry>): void {
    if (!query) {
      return;
    }

    this.searchQuery.set(query);

    if (query?.isBasicQuery) {
      const term = `(?i)${query.query || ''}`;
      const params = new ParamsBuilder<AuditEntry>()
        .filter('event', '~', term)
        .orFilter('username', '~', term)
        .orFilter('service', '~', term)
        .getParams();

      // TODO: Incorrect cast, because of incorrect typing inside of DataProvider
      this.dataProvider().setParams(params as unknown as [AuditQueryParams]);
    }

    if (query && !query.isBasicQuery) {
      // TODO: Incorrect cast, because of incorrect typing inside of DataProvider
      this.dataProvider().setParams(
        [(query as AdvancedSearchQuery<AuditEntry>).filters] as unknown as [AuditQueryParams],
      );
    }

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
        'service',
        this.translate.instant('Service'),
        of(Object.values(AuditService).map((key) => ({
          label: this.translate.instant(auditServiceLabels.get(key) || key),
          value: `"${this.translate.instant(auditServiceLabels.get(key) || key)}"`,
        }))),
        auditServiceLabels,
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

  private loadParamsFromRoute(): void {
    this.activatedRoute.params.pipe(untilDestroyed(this)).subscribe((params) => {
      const options = this.urlOptionsService.parseUrlOptions(params.options as string);

      this.dataProvider().setPagination({
        pageSize: options.pagination?.pageSize || 50,
        pageNumber: options.pagination?.pageNumber || 1,
      });

      if (options.sorting) this.dataProvider().setSorting(options.sorting);

      if (options.searchQuery) this.searchQuery.set(options.searchQuery as SearchQuery<AuditEntry>);

      this.onSearch(this.searchQuery());
    });
  }

  private mapUsersForSuggestions(users: User[] | AuditEntry[]): Option[] {
    return users.map((user) => ({
      label: user.username,
      value: `"${user.username}"`,
    }));
  }
}
