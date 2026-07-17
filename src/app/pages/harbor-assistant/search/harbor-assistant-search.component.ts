import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressBar } from '@angular/material/progress-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs/operators';
import {
  HarborAssistantSearchResultFilter,
  HarborAssistantSearchHit,
  HarborAssistantSearchResponse,
  HarborAssistantSearchSourceScope,
  HarborAssistantSearchWaterfallItem,
} from 'app/pages/harbor-assistant/shared/harbor-assistant.interface';
import { HarborAssistantContentApiService } from 'app/pages/harbor-assistant/shared/harbor-assistant-content-api.service';
import {
  buildHarborAssistantSearchPayload,
  buildHarborAssistantSearchWaterfallItems,
  harborAssistantSearchErrorMessage,
  harborAssistantSearchHasNoResults,
} from 'app/pages/harbor-assistant/shared/harbor-assistant-results';
import {
  HarborTimeRangeDialogComponent,
  HarborTimeRangeValue,
} from 'app/pages/harbor-assistant/shared/harbor-assistant-time-range-dialog.component';

interface HarborAssistantSearchPromptSuggestion {
  label: string;
  query: string;
  filter: HarborAssistantSearchResultFilter;
  sourceScope: HarborAssistantSearchSourceScope;
}

@Component({
  selector: 'ix-harbor-assistant-search',
  templateUrl: './harbor-assistant-search.component.html',
  styleUrl: './harbor-assistant-search.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    NgClass,
    MatButton,
    MatButtonToggle,
    MatButtonToggleGroup,
    MatCard,
    MatCardContent,
    MatProgressBar,
  ],
})
export class HarborAssistantSearchComponent implements OnInit {
  private readonly searchHistoryStorageKey = 'harborAssistant.searchTerms.v1';
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly api = inject(HarborAssistantContentApiService);
  private readonly dialog = inject(MatDialog);
  private readonly translate = inject(TranslateService);
  @ViewChild('searchResults') private searchResults?: ElementRef<HTMLElement>;

  protected readonly form = this.formBuilder.group({
    query: ['', Validators.required],
    filter: ['all' as HarborAssistantSearchResultFilter, Validators.required],
    sourceScope: ['all' as HarborAssistantSearchSourceScope, Validators.required],
    from: [''],
    to: [''],
  });

  protected readonly promptSuggestions: HarborAssistantSearchPromptSuggestion[] = [
    { label: 'Who is pouring beer?', query: 'who is pouring beer', filter: 'videos', sourceScope: 'all' },
    { label: 'What recent camera videos are available?', query: 'recent camera videos', filter: 'videos', sourceScope: 'all' },
    { label: 'What recent recordings are available?', query: 'recent recordings', filter: 'videos', sourceScope: 'all' },
    { label: 'summarize recent documents', query: 'summarize recent documents', filter: 'text', sourceScope: 'all' },
  ];

  protected readonly loading = signal(false);
  protected readonly response = signal<HarborAssistantSearchResponse | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly searchHistory = signal<string[]>([]);
  protected readonly useRetrieval = signal(true);

  ngOnInit(): void {
    this.searchHistory.set(this.loadSearchHistory());
  }

  search(): void {
    if (this.form.invalid || this.loading()) {
      return;
    }

    this.rememberSearchTerm(this.form.controls.query.value);
    const payload = buildHarborAssistantSearchPayload(
      this.form.controls.query.value,
      this.form.controls.filter.value,
      24,
      {
        from: this.localDateTimeToUnixSeconds(this.form.controls.from.value),
        sourceScope: this.form.controls.sourceScope.value,
        to: this.localDateTimeToUnixSeconds(this.form.controls.to.value),
        useRetrieval: this.useRetrieval(),
      },
    );

    this.loading.set(true);
    this.error.set(null);
    this.scrollToSearchResults();

    this.api.search(payload).pipe(
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: (response) => {
        this.response.set(response);
        this.scrollToSearchResults();
      },
      error: (error: unknown) => {
        this.response.set(null);
        this.error.set(harborAssistantSearchErrorMessage(error));
        this.scrollToSearchResults();
      },
    });
  }

  usePromptSuggestion(suggestion: HarborAssistantSearchPromptSuggestion): void {
    this.form.patchValue({
      query: this.translate.instant(suggestion.query),
      filter: suggestion.filter,
      sourceScope: suggestion.sourceScope,
      from: '',
      to: '',
    });
    this.error.set(null);
  }

  useSearchHistoryTerm(term: string): void {
    this.form.controls.query.setValue(term);
    this.form.controls.query.markAsDirty();
    this.error.set(null);
  }

  clearSearchHistory(): void {
    this.searchHistory.set([]);
    this.saveSearchHistory([]);
  }

  waterfallItems(): HarborAssistantSearchWaterfallItem[] {
    return buildHarborAssistantSearchWaterfallItems(this.response(), this.form.controls.filter.value);
  }

  noResults(): boolean {
    return this.waterfallItems().length === 0;
  }

  toggleRetrieval(): void {
    this.useRetrieval.update((selected) => !selected);
  }

  conversationResponse(result: HarborAssistantSearchResponse | null = this.response()): boolean {
    return result?.answer_intent === 'conversation';
  }

  hasAnyResult(result: HarborAssistantSearchResponse | null = this.response()): boolean {
    return !harborAssistantSearchHasNoResults(result);
  }

  availableResultFilters(result: HarborAssistantSearchResponse): HarborAssistantSearchResultFilter[] {
    const filters: HarborAssistantSearchResultFilter[] = [];
    if (result.images.length > 0) {
      filters.push('images');
    }
    if (result.documents.length > 0) {
      filters.push('text');
    }
    if (result.videos.length > 0) {
      filters.push('videos');
    }
    if (filters.length > 1) {
      filters.unshift('all');
    }
    return filters.filter((filter) => filter !== this.form.controls.filter.value);
  }

  switchFilter(filter: HarborAssistantSearchResultFilter): void {
    this.form.controls.filter.setValue(filter);
  }

  embeddingUnavailable(result: HarborAssistantSearchResponse | null = this.response()): boolean {
    const reason = result?.degraded_reason?.toLowerCase() ?? '';
    const warnings = (result?.warnings ?? []).join(' ').toLowerCase();
    const blockers = (result?.blockers ?? []).join(' ').toLowerCase();
    return reason.includes('embedding')
      || warnings.includes('embedding')
      || blockers.includes('embedding');
  }

  openHarborAssistantModels(): void {
    window.open('/ui/harbor-assistant?tab=settings&section=ai&focus=semantic-index', '_blank', 'noopener');
  }

  openPreview(item: HarborAssistantSearchWaterfallItem): void {
    window.open(item.previewUrl, '_blank', 'noopener');
  }

  searchScopeLabel(): string {
    switch (this.form.controls.sourceScope.value) {
      case 'dvr_library':
        return 'DVR media library';
      case 'nas_files':
        return 'NAS folders';
      case 'all':
      default:
        return 'All knowledge sources';
    }
  }

  timeRangeLabel(): string {
    const from = this.formatLocalDateTimeLabel(this.form.controls.from.value);
    const to = this.formatLocalDateTimeLabel(this.form.controls.to.value);
    if (!from && !to) {
      return this.translate.instant('All time');
    }
    return `${from || this.translate.instant('Any')} - ${to || this.translate.instant('Any')}`;
  }

  hasTimeRange(): boolean {
    return Boolean(this.form.controls.from.value || this.form.controls.to.value);
  }

  openTimeRangeDialog(): void {
    this.dialog.open<HarborTimeRangeDialogComponent, HarborTimeRangeValue, HarborTimeRangeValue | null>(
      HarborTimeRangeDialogComponent,
      {
        width: '560px',
        data: {
          from: this.form.controls.from.value,
          to: this.form.controls.to.value,
        },
      },
    ).afterClosed().subscribe((value) => {
      if (!value) {
        return;
      }
      this.form.patchValue(value);
      this.form.markAsDirty();
    });
  }

  clearTimeRange(): void {
    this.form.patchValue({ from: '', to: '' });
    this.form.markAsDirty();
  }

  resultTrackKey(index: number, item: HarborAssistantSearchWaterfallItem): string {
    return `${item.kind}:${item.hit.path}:${item.hit.chunk_id ?? index}`;
  }

  kindLabel(item: HarborAssistantSearchWaterfallItem): string {
    if (item.kind === 'image') {
      return 'Image';
    }
    if (item.kind === 'video') {
      return 'Video';
    }
    return 'Text';
  }

  scoreLabel(hit: HarborAssistantSearchHit): string {
    return `${hit.score}`;
  }

  videoPreviewUrl(item: HarborAssistantSearchWaterfallItem): string {
    return `${item.previewUrl}#t=0.1`;
  }

  sourceKinds(hit: HarborAssistantSearchHit): string {
    const kinds = hit.content_source_kinds ?? [];
    if (kinds.length > 0) {
      return kinds.join(', ');
    }
    return hit.provenance || hit.source_path || 'indexed';
  }

  matchedTerms(hit: HarborAssistantSearchHit): string {
    return (hit.matched_terms ?? []).join(', ');
  }

  summary(hit: HarborAssistantSearchHit): string {
    return hit.snippet || hit.provenance || hit.path;
  }

  emptyMessage(result: HarborAssistantSearchResponse): string {
    const query = this.form.controls.query.value.trim();
    const localizedSpring = this.translate.instant('spring');
    if (
      this.form.controls.filter.value === 'images'
      && (query.toLowerCase().includes('spring') || query.includes(localizedSpring))
    ) {
      return 'The current image filter has no related results. Switch to All to inspect other clues, or add and index a folder with spring photos.';
    }
    if (this.hasAnyResult(result)) {
      return 'No results for the current filter. Switch to a result type that has matches.';
    }
    return result.empty_guidance || result.empty_reason || 'No results found. Try another phrasing, or confirm the data sources are indexed in settings.';
  }

  filterLabel(filter: HarborAssistantSearchResultFilter): string {
    switch (filter) {
      case 'images':
        return 'Image';
      case 'text':
        return 'Text';
      case 'videos':
        return 'Video';
      case 'all':
      default:
        return 'All';
    }
  }

  searchStatusLabel(result: HarborAssistantSearchResponse): string {
    if (result.degraded) {
      return 'Degraded';
    }
    return result.status === 'ok' ? 'Complete' : result.status;
  }

  userFacingSearchNotice(message: string): string {
    const normalized = message.toLowerCase();
    if (normalized.includes('embedding') || normalized.includes('/v1/embeddings')) {
      return 'Vector search model is unavailable, so local lexical search was used temporarily.';
    }
    return message;
  }

  private localDateTimeToUnixSeconds(value: string): string | null {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    const timestamp = new Date(trimmed).getTime();
    if (!Number.isFinite(timestamp)) {
      return null;
    }
    return Math.floor(timestamp / 1000).toString();
  }

  private formatLocalDateTimeLabel(value: string): string {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
    if (!match) {
      return '';
    }
    return `${match[1]}/${match[2]}/${match[3]} ${match[4]}:${match[5]}`;
  }

  private scrollToSearchResults(): void {
    setTimeout(() => {
      this.searchResults?.nativeElement.scrollIntoView?.({
        block: 'start',
        behavior: 'smooth',
      });
    });
  }

  private rememberSearchTerm(value: string): void {
    const term = value.trim().replace(/\s+/g, ' ');
    if (!term) {
      return;
    }
    const next = [
      term,
      ...this.searchHistory().filter((item) => item !== term),
    ].slice(0, 10);
    this.searchHistory.set(next);
    this.saveSearchHistory(next);
  }

  private loadSearchHistory(): string[] {
    try {
      const raw = window.localStorage.getItem(this.searchHistoryStorageKey);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).slice(0, 10)
        : [];
    } catch {
      return [];
    }
  }

  private saveSearchHistory(history: string[]): void {
    try {
      window.localStorage.setItem(this.searchHistoryStorageKey, JSON.stringify(history));
    } catch {
      // Local search history is best-effort only.
    }
  }
}
