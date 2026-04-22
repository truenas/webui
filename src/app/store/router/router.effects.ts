import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { routerNavigationAction, RouterNavigationAction } from '@ngrx/router-store';
import { TranslateService } from '@ngx-translate/core';
import { switchMap, take, tap } from 'rxjs/operators';
import { WINDOW } from 'app/helpers/window.helper';
import { CustomRouterState } from 'app/store/router/custom-router-serializer';

@Injectable()
export class RouterEffects {
  private actions$ = inject(Actions);
  private titleService = inject(Title);
  private translate = inject(TranslateService);
  private window = inject<Window>(WINDOW);


  navigate$ = createEffect(
    () => this.actions$.pipe(
      ofType<RouterNavigationAction<CustomRouterState>>(routerNavigationAction),
      switchMap((data: RouterNavigationAction<CustomRouterState>) => {
        return this.translate.get(data.payload.routerState.title).pipe(
          take(1),
          tap((translatedTitle: string) => {
            this.titleService.setTitle(`${translatedTitle} - ${this.window.location.hostname}`);
          }),
        );
      }),
    ),
    { dispatch: false },
  );
}
