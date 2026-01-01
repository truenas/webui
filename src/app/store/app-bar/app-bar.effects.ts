import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { tap, withLatestFrom } from 'rxjs/operators';
import { appBarOpened, appBarMinimized, appBarClosed, appBarAdded } from './app-bar.actions';
import { selectAppBarState } from './app-bar.selectors';

const appBarStorageKey = 'ix-app-bar-state';

@Injectable()
export class AppBarEffects {
  private router = inject(Router);
  private actions$ = inject(Actions);
  private store = inject(Store);

  openAppBarState$ = createEffect(
    () => this.actions$.pipe(
      ofType(appBarOpened),
      tap(({ item }) => {
        if (item.state) {
          this.router.navigate(['/', ...item.state.split('/')]);
        }
      }),
    ),
    { dispatch: false },
  );

  minimizeAppBarState$ = createEffect(
    () => this.actions$.pipe(
      ofType(appBarMinimized, appBarClosed),
      tap(() => {
        this.router.navigate(['/desktop']);
      }),
    ),
    { dispatch: false },
  );

  saveAppBarState$ = createEffect(
    () => this.actions$.pipe(
      ofType(appBarOpened, appBarMinimized, appBarClosed, appBarAdded),
      withLatestFrom(this.store.select(selectAppBarState)),
      tap(([, state]) => {
        try {
          localStorage.setItem(appBarStorageKey, JSON.stringify(state));
        } catch (error) {
          console.error('Failed to save app-bar state to localStorage:', error);
        }
      }),
    ),
    { dispatch: false },
  );
}
