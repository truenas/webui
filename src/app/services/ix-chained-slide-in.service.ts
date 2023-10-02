import { Injectable, Type } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { UUID } from 'angular2-uuid';
import _ from 'lodash';
import { tap } from 'rxjs';

export interface ChainedSlideInState {
  components: { component: Type<unknown>; id: string }[];
}

@Injectable({
  providedIn: 'root',
})
export class IxChainedSlideInService extends ComponentStore<ChainedSlideInState> {

  readonly components$ = this.select((state) => state.components);

  constructor() {
    super({ components: [] });
    this.initialize();
  }

  initialize = this.effect((trigger$) => {
    return trigger$.pipe(
      tap(() => {
        this.setState(() => {
          return {
            components: [],
          };
        });
      }),
    );
  });

  pushComponent = this.updater((state, component: Type<unknown>) => {
    const newArray = _.cloneDeep(state.components);
    newArray.push({ component, id: UUID.UUID() });
    return {
      components: newArray,
    };
  });

  popComponent = this.updater((state) => {
    const newArray = _.cloneDeep(state.components);
    newArray.pop();
    return {
      components: newArray,
    };
  });
}