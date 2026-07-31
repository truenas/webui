import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import {
  HarborAssistantRetrievalSettingsDialogComponent,
} from 'app/pages/harbor-assistant/shared/harbor-assistant-retrieval-settings-dialog.component';
import { HarborAssistantRetrievalSettings } from 'app/pages/harbor-assistant/shared/harbor-assistant.interface';

describe('HarborAssistantRetrievalSettingsDialogComponent', () => {
  let spectator: Spectator<HarborAssistantRetrievalSettingsDialogComponent>;

  const settings: HarborAssistantRetrievalSettings = {
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

  const createComponent = createComponentFactory({
    component: HarborAssistantRetrievalSettingsDialogComponent,
    providers: [
      {
        provide: MAT_DIALOG_DATA,
        useValue: { settings },
      },
      mockProvider(MatDialogRef),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('keeps number inputs and sliders synchronized in both directions', () => {
    const sliders = spectator.queryAll<HTMLInputElement>('input[type="range"]');
    const numbers = spectator.queryAll<HTMLInputElement>('.range-control input[type="number"]');

    numbers[0].value = '0.2';
    numbers[0].dispatchEvent(new Event('input'));
    spectator.detectChanges();

    expect(sliders[0].value).toBe('0.2');

    sliders[1].value = '0.4';
    sliders[1].dispatchEvent(new Event('input'));
    spectator.detectChanges();

    expect(numbers[1].value).toBe('0.4');
  });
});
