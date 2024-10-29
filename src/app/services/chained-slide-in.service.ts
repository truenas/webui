import { ComponentType } from '@angular/cdk/portal';
import { Injectable, Type } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
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
  isComponentAlive?: boolean;
}

export interface ChainedComponentResponse<T = unknown> {
  response: T;
  error: unknown;
}

export interface ChainedComponentSerialized {
  id: string;
  component: Type<unknown>;
  close$: Subject<ChainedComponentResponse>;
  data?: unknown;
  wide?: boolean;
  isComponentAlive?: boolean;
}

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class ChainedSlideInService extends ComponentStore<ChainedSlideInState> {
  readonly components$: Observable<ChainedComponentSerialized[]> = this.select(
    (state) => this.getAliveComponents(state.components),
  );

  readonly isTopComponentWide$ = this.select((state) => {
    return !!(this.getAliveComponents(state.components).pop()?.wide);
  });

  constructor(private focusService: FocusService) {
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
    const componentId = UUID.UUID();
    newMap.set(componentId, {
      ...chainedComponentInfo,
    });
    return {
      components: newMap,
    };
  });

  // TODO: Update second argument to options
  open(
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
      isComponentAlive: true,
    });
    this.focusService.captureCurrentFocus();
    return close$.asObservable().pipe(tap(() => this.focusService.restoreFocus()));
  }

  popComponent = this.updater((state, id: string) => {
    const newMap = new Map(state.components);
    newMap.set(id, { ...newMap.get(id), isComponentAlive: false });
    this.focusOnTheCloseButton();
    return {
      components: newMap,
    };
  });

  closeAll = this.updater(() => {
    this.focusOnTheCloseButton();
    return {
      components: new Map(),
    };
  });

  swapComponent = this.updater((state, swapInfo: IncomingChainedComponent) => {
    const newMap = new Map(state.components);
    const popped = newMap.get(swapInfo.swapComponentId);
    const close$ = popped.close$;
    const componentId = UUID.UUID();
    newMap.set(componentId, {
      component: swapInfo.component,
      wide: swapInfo.wide,
      data: swapInfo.data,
      close$,
      isComponentAlive: true,
    });
    newMap.set(swapInfo.swapComponentId, {
      ...popped,
      isComponentAlive: false,
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
        isComponentAlive: componentInfo.isComponentAlive,
      } as ChainedComponentSerialized;
    });
  }

  getAliveComponents(components: Map<string, ChainedComponent>): ChainedComponentSerialized[] {
    return this.mapToSerializedArray(components).filter(
      (component) => component.isComponentAlive,
    );
  }

  private focusOnTheCloseButton(): void {
    timer(100).pipe(take(1)).subscribe(() => this.focusService.focusElementById('ix-close-icon'));
  }
}
