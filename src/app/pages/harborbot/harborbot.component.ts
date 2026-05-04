import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressBar } from '@angular/material/progress-bar';
import { TranslateModule } from '@ngx-translate/core';
import { finalize } from 'rxjs/operators';
import {
  HarborBotResultFilter,
  HarborBotSearchHit,
  HarborBotSearchResponse,
  HarborBotSourceScope,
  HarborBotWaterfallItem,
} from 'app/pages/harbor/shared/harbor.interface';
import { HarborApiService } from 'app/pages/harbor/shared/harbor-api.service';
import {
  buildHarborBotSearchPayload,
  buildHarborBotWaterfallItems,
  harborBotErrorMessage,
  harborBotHasNoResults,
} from 'app/pages/harbor/shared/harbor-results';
import {
  HarborTimeRangeDialogComponent,
  HarborTimeRangeValue,
} from 'app/pages/harbor/shared/harbor-time-range-dialog.component';

interface HarborBotPromptSuggestion {
  label: string;
  query: string;
  filter: HarborBotResultFilter;
  sourceScope: HarborBotSourceScope;
}

@Component({
  selector: 'ix-harborbot',
  templateUrl: './harborbot.component.html',
  styleUrl: './harborbot.component.scss',
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
export class HarborBotComponent implements OnInit {
  private readonly searchHistoryStorageKey = 'harborAssistant.searchTerms.v1';
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly api = inject(HarborApiService);
  private readonly dialog = inject(MatDialog);
  @ViewChild('searchResults') private searchResults?: ElementRef<HTMLElement>;

  protected readonly form = this.formBuilder.group({
    query: ['', Validators.required],
    filter: ['all' as HarborBotResultFilter, Validators.required],
    sourceScope: ['all' as HarborBotSourceScope, Validators.required],
    from: [''],
    to: [''],
  });

  protected readonly promptSuggestions: HarborBotPromptSuggestion[] = [
    { label: '谁在倒啤酒？', query: '谁在倒啤酒', filter: 'videos', sourceScope: 'all' },
    { label: '最近有哪些摄像头视频？', query: '最近有哪些摄像头视频', filter: 'videos', sourceScope: 'all' },
    { label: '最近有哪些录像？', query: '最近有哪些录像', filter: 'videos', sourceScope: 'all' },
    { label: '总结最近的文字资料', query: '总结最近的文字资料', filter: 'text', sourceScope: 'all' },
  ];

  protected readonly loading = signal(false);
  protected readonly response = signal<HarborBotSearchResponse | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly searchHistory = signal<string[]>([]);

  ngOnInit(): void {
    this.searchHistory.set(this.loadSearchHistory());
  }

  search(): void {
    if (this.form.invalid || this.loading()) {
      return;
    }

    this.rememberSearchTerm(this.form.controls.query.value);
    const payload = buildHarborBotSearchPayload(
      this.form.controls.query.value,
      this.form.controls.filter.value,
      24,
      {
        from: this.localDateTimeToUnixSeconds(this.form.controls.from.value),
        sourceScope: this.form.controls.sourceScope.value,
        to: this.localDateTimeToUnixSeconds(this.form.controls.to.value),
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
        this.error.set(harborBotErrorMessage(error));
        this.scrollToSearchResults();
      },
    });
  }

  usePromptSuggestion(suggestion: HarborBotPromptSuggestion): void {
    this.form.patchValue({
      query: suggestion.query,
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

  waterfallItems(): HarborBotWaterfallItem[] {
    return buildHarborBotWaterfallItems(this.response(), this.form.controls.filter.value);
  }

  noResults(): boolean {
    return this.waterfallItems().length === 0;
  }

  hasAnyResult(result: HarborBotSearchResponse | null = this.response()): boolean {
    return !harborBotHasNoResults(result);
  }

  availableResultFilters(result: HarborBotSearchResponse): HarborBotResultFilter[] {
    const filters: HarborBotResultFilter[] = [];
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

  switchFilter(filter: HarborBotResultFilter): void {
    this.form.controls.filter.setValue(filter);
  }

  embeddingUnavailable(result: HarborBotSearchResponse | null = this.response()): boolean {
    const reason = result?.degraded_reason?.toLowerCase() ?? '';
    const warnings = (result?.warnings ?? []).join(' ').toLowerCase();
    const blockers = (result?.blockers ?? []).join(' ').toLowerCase();
    return reason.includes('embedding')
      || warnings.includes('embedding')
      || blockers.includes('embedding');
  }

  openHarborDeskModels(): void {
    window.open('/ui/harbor-assistant?tab=settings&section=ai&focus=semantic-index', '_blank', 'noopener');
  }

  openPreview(item: HarborBotWaterfallItem): void {
    window.open(item.previewUrl, '_blank', 'noopener');
  }

  searchScopeLabel(): string {
    switch (this.form.controls.sourceScope.value) {
      case 'dvr_library':
        return 'DVR 媒体库';
      case 'nas_files':
        return 'NAS 文件夹';
      case 'all':
      default:
        return '全部知识源';
    }
  }

  timeRangeLabel(): string {
    const from = this.formatLocalDateTimeLabel(this.form.controls.from.value);
    const to = this.formatLocalDateTimeLabel(this.form.controls.to.value);
    if (!from && !to) {
      return '全部时间';
    }
    return `${from || '不限'} - ${to || '不限'}`;
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

  resultTrackKey(index: number, item: HarborBotWaterfallItem): string {
    return `${item.kind}:${item.hit.path}:${item.hit.chunk_id ?? index}`;
  }

  kindLabel(item: HarborBotWaterfallItem): string {
    if (item.kind === 'image') {
      return '图片';
    }
    if (item.kind === 'video') {
      return '视频';
    }
    return '文字';
  }

  scoreLabel(hit: HarborBotSearchHit): string {
    return `${hit.score}`;
  }

  videoPreviewUrl(item: HarborBotWaterfallItem): string {
    return `${item.previewUrl}#t=0.1`;
  }

  sourceKinds(hit: HarborBotSearchHit): string {
    const kinds = hit.content_source_kinds ?? [];
    if (kinds.length > 0) {
      return kinds.join(', ');
    }
    return hit.provenance || hit.source_path || 'indexed';
  }

  matchedTerms(hit: HarborBotSearchHit): string {
    return (hit.matched_terms ?? []).join(', ');
  }

  summary(hit: HarborBotSearchHit): string {
    return hit.snippet || hit.provenance || hit.path;
  }

  emptyMessage(result: HarborBotSearchResponse): string {
    const query = this.form.controls.query.value.trim();
    if (this.form.controls.filter.value === 'images' && query.includes('春天')) {
      return '当前图片筛选没有相关结果。可以切到全部查看其它线索，或先添加并索引包含春天照片的文件夹。';
    }
    if (this.hasAnyResult(result)) {
      return '当前筛选没有结果，可以切换到有结果的类型查看。';
    }
    return result.empty_guidance || result.empty_reason || '没有找到结果。可以换个说法，或到设置里确认数据源已索引。';
  }

  filterLabel(filter: HarborBotResultFilter): string {
    switch (filter) {
      case 'images':
        return '图片';
      case 'text':
        return '文字';
      case 'videos':
        return '视频';
      case 'all':
      default:
        return '全部';
    }
  }

  searchStatusLabel(result: HarborBotSearchResponse): string {
    if (result.degraded) {
      return '已降级';
    }
    return result.status === 'ok' ? '完成' : result.status;
  }

  userFacingSearchNotice(message: string): string {
    const normalized = message.toLowerCase();
    if (normalized.includes('embedding') || normalized.includes('/v1/embeddings')) {
      return '向量检索模型不可用，已临时使用本地词法检索。';
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
