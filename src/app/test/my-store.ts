import { ComponentStore } from '@ngrx/component-store';

export interface MyState {
  hasPizza: boolean;
}

const initialState: MyState = {
  hasPizza: false,
};

export class MyStore extends ComponentStore<MyState> {
  constructor() {
    super(initialState);
  }

  readonly hasPizza$ = this.select((state) => state.hasPizza);

  readonly setPizza = this.updater((state, pizza: boolean) => {
    return {
      ...state,
      hasPizza: pizza,
    };
  });
}
