import { Inject, Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { routerNavigationAction, RouterNavigationAction } from '@ngrx/router-store';
import { TranslateService } from '@ngx-translate/core';
import { tap } from 'rxjs/operators';
import { WINDOW } from 'app/helpers/window.helper';
import { CustomRouterState } from 'app/store/router/custom-router-serializer';

@Injectable()
export class RouterEffects {
  constructor(
    private actions$: Actions,
    private titleService: Title,
    private translate: TranslateService,
    @Inject(WINDOW) private window: Window,
  ) {}

  navigate$ = createEffect(
    () => this.actions$.pipe(
      ofType<RouterNavigationAction<CustomRouterState>>(routerNavigationAction),
      tap((data: RouterNavigationAction<CustomRouterState>) => {
        const translatedTitle = this.translate.instant(data.payload.routerState.title);
        this.titleService.setTitle(`${translatedTitle} - ${this.window.location.hostname}`);
      }),
    ),
    { dispatch: false },
  );
}
