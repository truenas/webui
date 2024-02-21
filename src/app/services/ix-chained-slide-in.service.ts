import { ComponentType } from '@angular/cdk/portal';
import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, Type } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { UUID } from 'angular2-uuid';
import {
  Observable, Subject, take, tap, timer,
} from 'rxjs';
import { FocusService } from 'app/services/focus.service';

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

export interface ChainedComponentSerialized {
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
  readonly components$: Observable<ChainedComponentSerialized[]> = this.select(
    (state) => this.mapToSerializedArray(state.components),
  );

  readonly isTopComponentWide$ = this.select((state) => {
    return !!(this.mapToSerializedArray(state.components).pop()?.wide);
  });

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private focusService: FocusService,
  ) {
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
    this.focusService.captureCurrentFocus();
    return close$.asObservable().pipe(tap(() => this.focusService.restoreFocus()));
  }

  popComponent = this.updater((state, id: string) => {
    const newMap = new Map(state.components);
    newMap.delete(id);
    this.focusOnTheCloseButton();
    return {
      components: newMap,
    };
  });

  swapComponent = this.updater((state, swapInfo: IncomingChainedComponent) => {
    const newMap = new Map(state.components);
    const popped = newMap.get(swapInfo.swapComponentId);
    const close$ = popped.close$;
    newMap.set(UUID.UUID(), {
      component: swapInfo.component,
      wide: swapInfo.wide,
      data: swapInfo.data,
      close$,
    });
    this.focusOnTheCloseButton();
    return {
      components: newMap,
    };
  });

  mapToSerializedArray(map: Map<string, ChainedComponent>): ChainedComponentSerialized[] {
    return Array.from(map, ([id, componentInfo]) => {
      return {
        id,
        component: componentInfo.component,
        close$: componentInfo.close$,
        wide: componentInfo.wide,
        data: componentInfo.data,
      } as ChainedComponentSerialized;
    });
  }

  private focusOnTheCloseButton(): void {
    timer(100).pipe(take(1)).subscribe(() => this.focusService.focusElementById('ix-close-icon'));
  }
}
