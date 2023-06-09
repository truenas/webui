import { RouterStateSnapshot } from '@angular/router';
import { RouterStateSerializer } from '@ngrx/router-store';

export interface CustomRouterState {
  url: string;
  title: string;
}

export class CustomRouterStateSerializer implements RouterStateSerializer<CustomRouterState> {
  serialize(routerState: RouterStateSnapshot): CustomRouterState {
    let route = routerState.root;

    while (route.firstChild) {
      route = route.firstChild;
    }
    const url = routerState.url;
    const title = route.data.title as string;

    return { url, title };
  }
}
