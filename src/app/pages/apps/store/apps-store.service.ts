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
  isSyncingCatalog: boolean;
}

const initialState: AppsState = {
  availableApps: [],
  recommendedApps: [],
  latestApps: [],
  categories: [],
  isLoading: false,
  isSyncingCatalog: false,
};

@UntilDestroy()
@Injectable()
export class AppsStore extends ComponentStore<AppsState> {
  private errorHandler = inject(ErrorHandlerService);
  private appsService = inject(ApplicationsService);
  private api = inject(ApiService);
  private dialogService = inject(DialogService);
  private translate = inject(TranslateService);

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
      tap(() => {
        // Always set loading to false after initial data load completes
        this.setLoadingState(false);
      }),
      switchMap(() => this.syncCatalogIfEmpty()),
      catchError((error: unknown) => {
        this.handleError(error);
        return EMPTY;
      }),
    );
  }

  /**
   * Checks if the catalog is empty and automatically syncs it if needed.
   * Shows a progress dialog to inform the user about the sync operation.
   */
  private syncCatalogIfEmpty(): Observable<unknown> {
    const state = this.get();

    // Check if already syncing to prevent race condition
    if (state.isSyncingCatalog) {
      return of(null);
    }

    const catalogIsEmpty = state.availableApps.length === 0 && state.categories.length === 0;

    if (!catalogIsEmpty) {
      return of(null);
    }

    // Set flag in state to prevent concurrent sync operations and turn on loading indicator
    this.patchState({ isSyncingCatalog: true, isLoading: true });

    return this.dialogService.jobDialog(
      this.api.job('catalog.sync'),
      {
        title: this.translate.instant('Syncing Catalog'),
        description: this.translate.instant('The catalog is being synced for the first time. This may take a few minutes.'),
        canMinimize: true,
      },
    ).afterClosed().pipe(
      switchMap((job) => {
        // If job completed successfully, reload catalog data
        if (job) {
          return this.reloadCatalogAfterSync();
        }
        // If job was cancelled, just return
        return of(null);
      }),
      tap(() => {
        // Always clear loading and sync flags after everything completes
        this.setLoadingState(false);
        this.patchState({ isSyncingCatalog: false });
      }),
      catchError(() => this.handleSyncError()),
    );
  }

  /**
   * Reloads catalog data after a successful sync operation.
   */
  private reloadCatalogAfterSync(): Observable<unknown> {
    return this.loadCatalogData();
  }

  /**
   * Handles errors during catalog sync operation.
   */
  private handleSyncError(): Observable<never> {
    this.setLoadingState(false);
    this.patchState({ isSyncingCatalog: false });

    this.errorHandler.showErrorModal(
      new Error(this.translate.instant('Failed to sync catalog. Please try clicking "Refresh Catalog" manually.')),
    );

    return EMPTY;
  }

  /**
   * Updates the loading state in the store.
   */
  private setLoadingState(isLoading: boolean): void {
    this.patchState({ isLoading });
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
