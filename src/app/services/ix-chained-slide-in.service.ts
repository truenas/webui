import { Injectable, Type } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { UUID } from 'angular2-uuid';
import { Observable, Subject, tap } from 'rxjs';

export interface ChainedSlideInState {
  components: Map<string, ChainedComponentInfo>;
}

export interface ChainedComponentInfo {
  component: Type<unknown>;
  close$: Subject<unknown>;
  wide?: boolean;
  data?: unknown;
}

export interface ChainedSlideInCloseResponse {
  response: unknown;
  error: unknown;
}

export interface ChainedComponentSeralized {
  id: string;
  component: Type<unknown>;
  close$: Subject<unknown>;
  data?: unknown;
  wide?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class IxChainedSlideInService extends ComponentStore<ChainedSlideInState> {
  readonly components$: Observable<ChainedComponentSeralized[]> = this.select(
    (state) => this.mapToSerializedArray(state.components),
  );

  readonly isTopComponentWide$ = this.select((state) => {
    return !!(this.mapToSerializedArray(state.components).pop()?.wide);
  });

  constructor() {
    super({ components: new Map() });
    this.initialize();
  }

  initialize = this.effect((trigger$) => {
    return trigger$.pipe(
      tap(() => {
        this.setState(() => {
          return {
            components: new Map(),
          };
        });
      }),
    );
  });

  pushComponentToStore = this.updater((state, chainedComponentInfo: ChainedComponentInfo) => {
    const newMap = new Map(state.components);
    newMap.set(UUID.UUID(), {
      ...chainedComponentInfo,
    });
    return {
      components: newMap,
    };
  });

  pushComponent(component: Type<unknown>, wide: boolean, data?: unknown): Observable<ChainedSlideInCloseResponse> {
    const close$ = new Subject<ChainedSlideInCloseResponse>();
    this.pushComponentToStore({
      component,
      wide,
      data,
      close$,
    });
    return close$.asObservable();
  }

  popComponent = this.updater((state) => {
    const newMap = new Map(state.components);
    const all = this.mapToSerializedArray(state.components);
    const popped = all.pop();
    newMap.delete(popped.id);
    return {
      components: newMap,
    };
  });

  mapToSerializedArray(map: Map<string, ChainedComponentInfo>): ChainedComponentSeralized[] {
    return Array.from(map, ([id, componentInfo]) => {
      return {
        id,
        component: componentInfo.component,
        close$: componentInfo.close$,
        wide: componentInfo.wide,
        data: componentInfo.data,
      };
    });
  }
}
