import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { routerNavigationAction, RouterNavigationAction } from '@ngrx/router-store';
import { tap } from 'rxjs/operators';
import { CustomRouterState } from 'app/store/router/custom-router-serializer';

@Injectable()
export class RouterEffects {
  constructor(private actions$: Actions, private titleService: Title) {}

  navigate$ = createEffect(
    () => this.actions$.pipe(
      ofType<RouterNavigationAction<CustomRouterState>>(routerNavigationAction),
      tap((data: RouterNavigationAction<CustomRouterState>) => {
        this.titleService.setTitle(
          data.payload.routerState.title + ' - ' + window.location.hostname,
        );
      }),
    ),
    { dispatch: false },
  );
}
