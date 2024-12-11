import { Injectable } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { ComponentStore } from '@ngrx/component-store';
import {
  EMPTY,
  Observable, catchError, combineLatest, of, switchMap, tap,
} from 'rxjs';
import { AppExtraCategory } from 'app/enums/app-extra-category.enum';
import { AvailableApp } from 'app/interfaces/available-app.interface';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';

export interface AppsByCategory {
  title: string;
  apps: AvailableApp[];
  totalApps: number;
  category: string;
}

export interface AppsState {
  availableApps: AvailableApp[];
  latestApps: AvailableApp[];
  recommendedApps: AvailableApp[];
  categories: string[];
  isLoading: boolean;
}

const initialState: AppsState = {
  availableApps: [],
  recommendedApps: [],
  latestApps: [],
  categories: [],
  isLoading: false,
};

@UntilDestroy()
@Injectable()
export class AppsStore extends ComponentStore<AppsState> {
  readonly isLoading$ = this.select((state) => state.isLoading);

  readonly recommendedApps$ = this.select((state) => state.recommendedApps);
  readonly latestApps$ = this.select((state) => state.latestApps);
  readonly appsCategories$ = this.select((state) => [
    ...state.categories,
    AppExtraCategory.NewAndUpdated,
    AppExtraCategory.Recommended,
  ]);

  readonly availableApps$ = this.select((state) => state.availableApps);

  constructor(
    private errorHandler: ErrorHandlerService,
    private appsService: ApplicationsService,
  ) {
    super(initialState);
    this.initialize();
  }

  private handleError(error: unknown): void {
    this.errorHandler.showErrorModal(error);
    this.patchState((state: AppsState): AppsState => {
      return {
        ...state,
        isLoading: false,
      };
    });
  }

  readonly initialize = this.effect((triggers$: Observable<void>) => {
    return triggers$.pipe(
      switchMap(() => this.loadCatalog()),
    );
  });

  loadCatalog(): Observable<unknown> {
    return of(null).pipe(
      tap(() => {
        this.patchState({
          ...initialState,
          isLoading: true,
        });
      }),
      switchMap(() => {
        return combineLatest([
          this.loadLatestApps(),
          this.loadAvailableApps(),
          this.loadCategories(),
        ]);
      }),
      tap(() => {
        this.patchState((state: AppsState): AppsState => {
          return {
            ...state,
            isLoading: false,
          };
        });
      }),
      catchError((error: unknown) => {
        this.handleError(error);
        return EMPTY;
      }),
    );
  }

  private loadLatestApps(): Observable<unknown> {
    return this.appsService.getLatestApps().pipe(
      catchError((error: unknown) => {
        this.handleError(error);
        return of([]);
      }),
      tap((latestApps: AvailableApp[]) => {
        this.patchState((state) => {
          return {
            ...state,
            latestApps,
          };
        });
      }),
    );
  }

  private loadAvailableApps(): Observable<unknown> {
    return this.appsService.getAvailableApps().pipe(
      catchError((error: unknown) => {
        this.handleError(error);
        return of([]);
      }),
      tap((availableApps: AvailableApp[]) => {
        this.patchState((state) => {
          return {
            ...state,
            availableApps: [...availableApps],
            recommendedApps: availableApps
              .filter((app) => app.recommended)
              .map((app) => ({ ...app, categories: [...app.categories, AppExtraCategory.Recommended] })),
          };
        });
      }),
    );
  }

  private loadCategories(): Observable<unknown> {
    return this.appsService.getAllAppsCategories().pipe(
      catchError((error: unknown) => {
        this.handleError(error);
        return of([]);
      }),
      tap((categories: string[]) => {
        this.patchState((state) => {
          return {
            ...state,
            categories: [...categories],
          };
        });
      }),
    );
  }
}
