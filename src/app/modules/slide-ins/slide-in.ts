import { Injectable } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { ComponentStore } from '@ngrx/component-store';
import { UUID } from 'angular2-uuid';
import {
  Observable, Subject, take, tap, timer,
} from 'rxjs';
import {
  ComponentInSlideIn,
  ComponentSerialized,
  IncomingSlideInComponent,
  SlideInComponent,
  SlideInResponse,
  SlideInState,
} from 'app/modules/slide-ins/slide-in.interface';
import { FocusService } from 'app/services/focus.service';

@UntilDestroy()
// eslint-disable-next-line angular-file-naming/service-filename-suffix
@Injectable({
  providedIn: 'root',
})
export class SlideIn extends ComponentStore<SlideInState> {
  readonly components$: Observable<ComponentSerialized[]> = this.select(
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

  private pushComponentToStore = this.updater((state, componentInfo: SlideInComponent) => {
    const newMap = new Map(state.components);
    const componentId = UUID.UUID();
    newMap.set(componentId, {
      ...componentInfo,
    });
    return {
      components: newMap,
    };
  });

  open<D, R>(
    component: ComponentInSlideIn<D, R>,
    options?: { wide?: boolean; data?: D },
  ): Observable<SlideInResponse<R>> {
    const close$ = new Subject<SlideInResponse<R>>();
    this.pushComponentToStore({
      component,
      wide: options?.wide || false,
      data: options?.data,
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

  closeLast = this.updater((state) => {
    const newMap = new Map(state.components);
    const { id } = this.getAliveComponents(newMap).pop();
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

  swapComponent = this.updater((state, swapInfo: IncomingSlideInComponent) => {
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

  mapToSerializedArray(map: Map<string, SlideInComponent>): ComponentSerialized[] {
    return Array.from(map, ([id, componentInfo]) => {
      return {
        id,
        component: componentInfo.component,
        close$: componentInfo.close$,
        wide: componentInfo.wide,
        data: componentInfo.data,
        isComponentAlive: componentInfo.isComponentAlive,
      } as ComponentSerialized;
    });
  }

  getAliveComponents(components: Map<string, SlideInComponent>): ComponentSerialized[] {
    return this.mapToSerializedArray(components).filter(
      (component) => component.isComponentAlive,
    );
  }

  private focusOnTheCloseButton(): void {
    timer(100).pipe(take(1)).subscribe(() => this.focusService.focusElementById('ix-close-icon'));
  }
}
