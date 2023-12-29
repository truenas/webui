import { Injectable, Type } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { UUID } from 'angular2-uuid';
import {
  Observable, Subject, take, tap,
} from 'rxjs';

export interface ChainedSlideInState {
  components: Map<string, ChainedComponentInfo>;
}

export interface SwapChainedComponentInfo {
  oldComponentId: string;
  newComponentInfo: ChainedComponentInfo;
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

  private pushComponentToStore = this.updater((state, chainedComponentInfo: ChainedComponentInfo) => {
    const newMap = new Map(state.components);
    newMap.set(UUID.UUID(), {
      ...chainedComponentInfo,
    });
    return {
      components: newMap,
    };
  });

  pushComponent(
    component: Type<unknown>,
    wide = false,
    data?: unknown,
  ): Observable<ChainedSlideInCloseResponse> {
    const close$ = new Subject<ChainedSlideInCloseResponse>();
    this.pushComponentToStore({
      component,
      wide,
      data,
      close$,
    });
    return close$.asObservable().pipe(take(1));
  }

  popComponent = this.updater((state, id: string) => {
    const newMap = new Map(state.components);
    const popped = newMap.get(id);
    popped.close$.complete();
    newMap.delete(id);
    return {
      components: newMap,
    };
  });

  swapComponent = this.updater((state, swapInfo: SwapChainedComponentInfo) => {
    const newMap = new Map(state.components);
    const popped = newMap.get(swapInfo.oldComponentId);
    const close$ = popped.close$;
    newMap.delete(swapInfo.oldComponentId);
    newMap.set(UUID.UUID(), {
      component: swapInfo.newComponentInfo.component,
      wide: swapInfo.newComponentInfo.wide,
      data: swapInfo.newComponentInfo.data,
      close$,
    });
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
