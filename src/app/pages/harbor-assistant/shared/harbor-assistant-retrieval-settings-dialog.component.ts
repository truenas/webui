import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { TranslateModule } from '@ngx-translate/core';
import { HarborAssistantRetrievalSettings } from 'app/pages/harbor-assistant/shared/harbor-assistant.interface';

export interface HarborAssistantRetrievalSettingsDialogData {
  settings: HarborAssistantRetrievalSettings;
}

const recommendedSettings: HarborAssistantRetrievalSettings = {
  query_expansion_enabled: true,
  fusion_strategy: 'rrf',
  rrf_k: 60,
  lexical_weight: 0.35,
  vector_weight: 0.65,
  candidate_limit: 80,
  lexical_min_score: 0,
  vector_min_score: 0.25,
  semantic_only_min_score: 0,
  rerank_enabled: true,
  rerank_top_k: 30,
  rerank_min_score: 0.15,
  mmr_enabled: true,
  mmr_lambda: 0.7,
};

@Component({
  selector: 'ix-harbor-assistant-retrieval-settings-dialog',
  templateUrl: './harbor-assistant-retrieval-settings-dialog.component.html',
  styleUrl: './harbor-assistant-retrieval-settings-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, TranslateModule, MatButton, MatSlideToggle],
})
export class HarborAssistantRetrievalSettingsDialogComponent {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly dialogRef = inject(MatDialogRef<HarborAssistantRetrievalSettingsDialogComponent>);
  private readonly data = inject<HarborAssistantRetrievalSettingsDialogData>(MAT_DIALOG_DATA);

  protected readonly form = this.formBuilder.group({
    queryExpansionEnabled: [this.data.settings.query_expansion_enabled],
    candidateLimit: [this.data.settings.candidate_limit, [Validators.required, Validators.min(1), Validators.max(500)]],
    lexicalMinScore: [
      this.data.settings.lexical_min_score,
      [Validators.required, Validators.min(0), Validators.max(1)],
    ],
    vectorMinScore: [this.data.settings.vector_min_score, [Validators.required, Validators.min(0), Validators.max(1)]],
    rerankEnabled: [this.data.settings.rerank_enabled],
    rerankTopK: [this.data.settings.rerank_top_k, [Validators.required, Validators.min(1), Validators.max(500)]],
    rerankMinScore: [this.data.settings.rerank_min_score, [Validators.required, Validators.min(0), Validators.max(1)]],
    mmrEnabled: [this.data.settings.mmr_enabled],
    deduplicationStrength: [
      1 - this.data.settings.mmr_lambda,
      [Validators.required, Validators.min(0), Validators.max(1)],
    ],
  });

  protected resetRecommended(): void {
    this.form.setValue({
      queryExpansionEnabled: recommendedSettings.query_expansion_enabled,
      candidateLimit: recommendedSettings.candidate_limit,
      lexicalMinScore: recommendedSettings.lexical_min_score,
      vectorMinScore: recommendedSettings.vector_min_score,
      rerankEnabled: recommendedSettings.rerank_enabled,
      rerankTopK: recommendedSettings.rerank_top_k,
      rerankMinScore: recommendedSettings.rerank_min_score,
      mmrEnabled: recommendedSettings.mmr_enabled,
      deduplicationStrength: 1 - recommendedSettings.mmr_lambda,
    });
    this.form.markAsDirty();
  }

  protected updateLexicalMinScore(event: Event): void {
    this.updateRangeValue(this.form.controls.lexicalMinScore, event);
  }

  protected updateVectorMinScore(event: Event): void {
    this.updateRangeValue(this.form.controls.vectorMinScore, event);
  }

  protected updateRerankMinScore(event: Event): void {
    this.updateRangeValue(this.form.controls.rerankMinScore, event);
  }

  protected updateDeduplicationStrength(event: Event): void {
    this.updateRangeValue(this.form.controls.deduplicationStrength, event);
  }

  protected cancel(): void {
    this.dialogRef.close();
  }

  protected save(): void {
    if (this.form.invalid) {
      return;
    }
    const value = this.form.getRawValue();
    this.dialogRef.close({
      ...this.data.settings,
      query_expansion_enabled: value.queryExpansionEnabled,
      candidate_limit: value.candidateLimit,
      lexical_min_score: value.lexicalMinScore,
      vector_min_score: value.vectorMinScore,
      rerank_enabled: value.rerankEnabled,
      rerank_top_k: Math.min(value.rerankTopK, value.candidateLimit),
      rerank_min_score: value.rerankMinScore,
      mmr_enabled: value.mmrEnabled,
      mmr_lambda: 1 - value.deduplicationStrength,
    } satisfies HarborAssistantRetrievalSettings);
  }

  private updateRangeValue(control: FormControl<number>, event: Event): void {
    control.setValue((event.target as HTMLInputElement).valueAsNumber);
    control.markAsDirty();
  }
}
