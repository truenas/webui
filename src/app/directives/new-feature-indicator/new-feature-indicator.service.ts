import { EventEmitter, Injectable } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store, select } from '@ngrx/store';
import { NewFeatureIndicator } from 'app/directives/new-feature-indicator/new-feature-indicator.interface';
import { AppsState } from 'app/store';
import { shownNewIndicatorKeysUpdated } from 'app/store/preferences/preferences.actions';
import { selectPreferencesState } from 'app/store/preferences/preferences.selectors';

@UntilDestroy()
@Injectable()
export class NewFeatureIndicatorService {
  onShown = new EventEmitter<NewFeatureIndicator>();
  private shownIndicatorKeys: string[] = [];

  constructor(
    private store$: Store<AppsState>,
  ) {
    this.store$.pipe(select(selectPreferencesState), untilDestroyed(this)).subscribe((prefs) => {
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
