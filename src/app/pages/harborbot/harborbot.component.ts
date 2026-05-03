import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatProgressBar } from '@angular/material/progress-bar';
import { TranslateModule } from '@ngx-translate/core';
import { finalize } from 'rxjs/operators';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
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
    PageHeaderComponent,
    ReactiveFormsModule,
    TranslateModule,
    NgClass,
    MatButton,
    MatButtonToggle,
    MatButtonToggleGroup,
    MatCard,
    MatCardContent,
    MatFormField,
    MatInput,
    MatLabel,
    MatProgressBar,
  ],
})
export class HarborBotComponent {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly api = inject(HarborApiService);
  @ViewChild('searchResults') private searchResults?: ElementRef<HTMLElement>;

  protected readonly form = this.formBuilder.group({
    query: ['', Validators.required],
    filter: ['all' as HarborBotResultFilter, Validators.required],
    sourceScope: ['all' as HarborBotSourceScope, Validators.required],
    from: [''],
    to: [''],
  });

  protected readonly promptSuggestions: HarborBotPromptSuggestion[] = [
    { label: '找到和春天相关的照片', query: '找到和春天相关的照片', filter: 'images', sourceScope: 'all' },
    { label: '谁在倒啤酒？', query: '谁在倒啤酒', filter: 'videos', sourceScope: 'all' },
    { label: '最近有哪些摄像头视频？', query: '最近有哪些摄像头视频', filter: 'videos', sourceScope: 'all' },
    { label: '总结最近的文字资料', query: '总结最近的文字资料', filter: 'text', sourceScope: 'all' },
  ];

  protected readonly loading = signal(false);
  protected readonly response = signal<HarborBotSearchResponse | null>(null);
  protected readonly error = signal<string | null>(null);

  search(): void {
    if (this.form.invalid || this.loading()) {
      return;
    }

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

  waterfallItems(): HarborBotWaterfallItem[] {
    return buildHarborBotWaterfallItems(this.response(), this.form.controls.filter.value);
  }

  noResults(): boolean {
    return harborBotHasNoResults(this.response());
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
    window.open('/ui/harbordesk?tab=models&focus=semantic-index', '_blank', 'noopener');
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

  resultTrackKey(index: number, item: HarborBotWaterfallItem): string {
    return `${item.kind}:${item.hit.path}:${item.hit.chunk_id ?? index}`;
  }

  kindLabel(item: HarborBotWaterfallItem): string {
    if (item.kind === 'image') {
      return 'Image';
    }
    if (item.kind === 'video') {
      return 'Video';
    }
    return 'Text';
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
    return result.empty_guidance || result.empty_reason || 'No results found.';
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

  private scrollToSearchResults(): void {
    setTimeout(() => {
      this.searchResults?.nativeElement.scrollIntoView?.({
        block: 'start',
        behavior: 'smooth',
      });
    });
  }
}
