import { Injectable, inject } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { ComponentStore } from '@ngrx/component-store';
import { TranslateService } from '@ngx-translate/core';
import {
  EMPTY,
  Observable, catchError, combineLatest, of, switchMap, tap,
} from 'rxjs';
import { AppExtraCategory } from 'app/enums/app-extra-category.enum';
import { AvailableApp } from 'app/interfaces/available-app.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

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
  private errorHandler = inject(ErrorHandlerService);
  private appsService = inject(ApplicationsService);
  private api = inject(ApiService);
  private dialogService = inject(DialogService);
  private translate = inject(TranslateService);
  private isSyncingCatalog = false;

  readonly isLoading$ = this.select((state) => state.isLoading);

  readonly recommendedApps$ = this.select((state) => state.recommendedApps);
  readonly latestApps$ = this.select((state) => state.latestApps);
  readonly appsCategories$ = this.select((state) => [
    ...state.categories,
    AppExtraCategory.NewAndUpdated,
    AppExtraCategory.Recommended,
  ]);

  readonly availableApps$ = this.select((state) => state.availableApps);

  constructor() {
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
      switchMap(() => this.loadCatalogData()),
      switchMap(() => {
        // Check if catalog is empty and needs sync (only on first load)
        const state = this.get();
        const catalogIsEmpty = state.availableApps.length === 0 && state.categories.length === 0;

        if (catalogIsEmpty && !this.isSyncingCatalog) {
          this.isSyncingCatalog = true;

          // Show job dialog for user feedback during sync
          return this.dialogService.jobDialog(
            this.api.job('catalog.sync'),
            {
              title: this.translate.instant('Syncing Catalog'),
              description: this.translate.instant('The catalog is being synced for the first time. This may take a few minutes.'),
              canMinimize: true,
            },
          ).afterClosed().pipe(
            switchMap(() => {
              this.isSyncingCatalog = false;
              // Reload catalog after sync completes
              return this.loadCatalogData();
            }),
            tap(() => {
              this.patchState((prevState: AppsState): AppsState => {
                return {
                  ...prevState,
                  isLoading: false,
                };
              });
            }),
            catchError(() => {
              this.isSyncingCatalog = false;
              this.patchState((prevState: AppsState): AppsState => {
                return {
                  ...prevState,
                  isLoading: false,
                };
              });
              // Show specific error message for catalog sync failure
              this.errorHandler.showErrorModal(
                new Error(this.translate.instant('Failed to sync catalog. Please try clicking "Refresh Catalog" manually.')),
              );
              return EMPTY;
            }),
          );
        }

        // No sync needed, set loading to false
        this.patchState((prevState: AppsState): AppsState => {
          return {
            ...prevState,
            isLoading: false,
          };
        });
        return of(null);
      }),
      catchError((error: unknown) => {
        this.handleError(error);
        return EMPTY;
      }),
    );
  }

  private loadCatalogData(): Observable<unknown> {
    return combineLatest([
      this.loadLatestApps(),
      this.loadAvailableApps(),
      this.loadCategories(),
    ]);
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
