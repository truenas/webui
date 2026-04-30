import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
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
  HarborBotWaterfallItem,
} from 'app/pages/harborbot/interfaces/harborbot.interface';
import { HarborBotApiService } from 'app/pages/harborbot/services/harborbot-api.service';
import {
  buildHarborBotSearchPayload,
  buildHarborBotWaterfallItems,
  harborBotErrorMessage,
  harborBotHasNoResults,
} from 'app/pages/harborbot/utils/harborbot-results';

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
  private readonly api = inject(HarborBotApiService);

  protected readonly form = this.formBuilder.group({
    query: ['找到和春天相关的照片', Validators.required],
    filter: ['all' as HarborBotResultFilter, Validators.required],
  });

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
    );
    this.loading.set(true);
    this.error.set(null);

    this.api.search(payload).pipe(
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: (response) => this.response.set(response),
      error: (error: unknown) => {
        this.response.set(null);
        this.error.set(harborBotErrorMessage(error));
      },
    });
  }

  waterfallItems(): HarborBotWaterfallItem[] {
    return buildHarborBotWaterfallItems(this.response(), this.form.controls.filter.value);
  }

  noResults(): boolean {
    return harborBotHasNoResults(this.response());
  }

  openPreview(item: HarborBotWaterfallItem): void {
    window.open(item.previewUrl, '_blank', 'noopener');
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
}
