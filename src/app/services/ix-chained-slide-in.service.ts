import { ComponentType } from '@angular/cdk/portal';
import { Injectable, Type } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { UUID } from 'angular2-uuid';
import {
  Observable, Subject, tap,
} from 'rxjs';

export interface ChainedComponentRef {
  close: (response: ChainedComponentResponse) => void;
  /**
   * This method will swap the caller 'chained-slide-in' component with the provided component.
   * The caller component will be destroyed. However, the 'on-close' observable assigned
   * to the old component will be assigned to the new component being swapped in.
   * Further explanation: This will allow a "list" component that started a 'chained-slide-in'
   * with a "wizard" component to continue to listen to the 'on-close' observable even if the
   * user chooses to use the "form" component instead. Meaning the "wizard" component called
   * this swap method and destroyed itself and a new instance of the "form" component came in
   * it's place. The old observable that the "list" component got when opening the "wizard"
   * component will continue to work for the new "form" component instance as well. This can be
   * chained infinitely (but shouldn't). This enables one point response handling instead of
   * chaining new response subscriptions for the 'on-close' observable whenever the swap needs to happen.
   */
  swap: (component: Type<unknown>, wide: boolean, data?: unknown) => void;
}

export interface IncomingChainedComponent {
  component: ComponentType<unknown>;
  wide: boolean;
  data: unknown;
  swapComponentId?: string;
}

export interface ChainedSlideInState {
  components: Map<string, ChainedComponent>;
}

export interface ChainedComponent {
  component: Type<unknown>;
  close$: Subject<ChainedComponentResponse>;
  wide: boolean;
  data: unknown;
}

export interface ChainedComponentResponse {
  response: unknown;
  error: unknown;
}

export interface ChainedComponentSeralized {
  id: string;
  component: Type<unknown>;
  close$: Subject<ChainedComponentResponse>;
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

  private pushComponentToStore = this.updater((state, chainedComponentInfo: ChainedComponent) => {
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
  ): Observable<ChainedComponentResponse> {
    const close$ = new Subject<ChainedComponentResponse>();
    this.pushComponentToStore({
      component,
      wide,
      data,
      close$,
    });
    return close$.asObservable();
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

  swapComponent = this.updater((state, swapInfo: IncomingChainedComponent) => {
    const newMap = new Map(state.components);
    const popped = newMap.get(swapInfo.swapComponentId);
    const close$ = popped.close$;
    newMap.delete(swapInfo.swapComponentId);
    newMap.set(UUID.UUID(), {
      component: swapInfo.component,
      wide: swapInfo.wide,
      data: swapInfo.data,
      close$,
    });
    return {
      components: newMap,
    };
  });

  mapToSerializedArray(map: Map<string, ChainedComponent>): ChainedComponentSeralized[] {
    return Array.from(map, ([id, componentInfo]) => {
      return {
        id,
        component: componentInfo.component,
        close$: componentInfo.close$,
        wide: componentInfo.wide,
        data: componentInfo.data,
      } as ChainedComponentSeralized;
    });
  }
}
