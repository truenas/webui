import {
  Injectable, Injector, Signal, inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MemoizedSelector, Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { EntitlementFeature } from 'app/enums/entitlement-feature.enum';
import { EntitlementEntry } from 'app/interfaces/entitlement.interface';
import { AppState } from 'app/store';
import { selectEntitlement, selectIsEntitled } from 'app/store/entitlements/entitlements.selectors';

/**
 * Reads middleware's entitlement decisions; never recomputes them.
 *
 * Callers still own whether a control is applicable at all (hardware presence, RBAC,
 * runtime state) and how a denial is presented.
 */
@Injectable({
  providedIn: 'root',
})
export class EntitlementsService {
  private store$ = inject<Store<AppState>>(Store);
  private injector = inject(Injector);

  // `createSelector` returns a fresh instance per call, so caching here is what preserves
  // memoization across call sites.
  private readonly entitledSelectors = new Map<EntitlementFeature, MemoizedSelector<object, boolean | undefined>>();
  private readonly entrySelectors = new Map<
    EntitlementFeature, MemoizedSelector<object, EntitlementEntry | undefined>
  >();

  private readonly entitledSignals = new Map<EntitlementFeature, Signal<boolean | undefined>>();
  private readonly entrySignals = new Map<EntitlementFeature, Signal<EntitlementEntry | undefined>>();

  /** `undefined` while loading, deliberately not `false`. Check for it if a surface needs
   * to tell "loading" from "denied". */
  entitled(feature: EntitlementFeature): Signal<boolean | undefined> {
    return this.cached(this.entitledSignals, feature, () => toSignal(
      this.store$.select(this.entitledSelector(feature)),
      { injector: this.injector },
    ));
  }

  /** Emits nothing until the answer is real, so no consumer acts on a transient denial. */
  entitled$(feature: EntitlementFeature): Observable<boolean> {
    return this.store$.select(this.entitledSelector(feature)).pipe(
      filter((entitled): entitled is boolean => entitled !== undefined),
    );
  }

  /** For explaining a denial. `undefined` means either not loaded or not gated. */
  entitlement(feature: EntitlementFeature): Signal<EntitlementEntry | undefined> {
    return this.cached(this.entrySignals, feature, () => toSignal(
      this.store$.select(this.entrySelector(feature)),
      { injector: this.injector },
    ));
  }

  private entitledSelector(feature: EntitlementFeature): MemoizedSelector<object, boolean | undefined> {
    return this.cached(this.entitledSelectors, feature, () => selectIsEntitled(feature));
  }

  private entrySelector(feature: EntitlementFeature): MemoizedSelector<object, EntitlementEntry | undefined> {
    return this.cached(this.entrySelectors, feature, () => selectEntitlement(feature));
  }

  private cached<T>(cache: Map<EntitlementFeature, T>, feature: EntitlementFeature, build: () => T): T {
    let value = cache.get(feature);
    if (value === undefined) {
      value = build();
      cache.set(feature, value);
    }
    return value;
  }
}
