import { DestroyRef, EventEmitter, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store, select } from '@ngrx/store';
import { NewFeatureIndicator } from 'app/directives/new-feature-indicator/new-feature-indicator.interface';
import { AppState } from 'app/store';
import { shownNewIndicatorKeysUpdated } from 'app/store/preferences/preferences.actions';
import { selectPreferencesState } from 'app/store/preferences/preferences.selectors';

@Injectable({
  providedIn: 'root',
})
export class NewFeatureIndicatorService {
  private readonly destroyRef = inject(DestroyRef);
  private store$ = inject<Store<AppState>>(Store);

  onShown = new EventEmitter<NewFeatureIndicator>();
  private shownIndicatorKeys: string[] = [];

  constructor() {
    this.store$.pipe(select(selectPreferencesState), takeUntilDestroyed(this.destroyRef)).subscribe((prefs) => {
      this.shownIndicatorKeys = prefs?.preferences?.shownNewFeatureIndicatorKeys || [];
    });
  }

  markIndicatorAsShown(indicator: NewFeatureIndicator): void {
    const keys = new Set([...this.shownIndicatorKeys, indicator.key]);
    this.shownIndicatorKeys = [...keys];
    this.store$.dispatch(
      shownNewIndicatorKeysUpdated({ keys: this.shownIndicatorKeys }),
    );
    this.onShown.emit(indicator);
  }

  wasIndicatorShown(indicator: NewFeatureIndicator): boolean {
    return this.shownIndicatorKeys.includes(indicator.key);
  }
}
