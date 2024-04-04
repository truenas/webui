import { EventEmitter, Injectable } from '@angular/core';
import { NewFeatureIndicator } from 'app/directives/common/new-feature-indicator/new-feature-indicator.interface';

@Injectable()
export class NewFeatureIndicatorService {
  onShown = new EventEmitter<NewFeatureIndicator>();
  private shownKeys = new Set<NewFeatureIndicator>();

  markIndicatorAsShown(indicator: NewFeatureIndicator): void {
    this.shownKeys.add(indicator);
    this.onShown.emit(indicator);
  }

  wasIndicatorShown(indicator: NewFeatureIndicator): boolean {
    return this.shownKeys.has(indicator);
  }
}
