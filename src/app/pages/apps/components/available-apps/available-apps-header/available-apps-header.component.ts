import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, Injector, OnInit, ViewContainerRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatAnchor, MatButton } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { tnIconMarker, TnIconComponent } from '@truenas/ui-components';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { BehaviorSubject, debounceTime, distinctUntilChanged, filter, take } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { AppExtraCategory } from 'app/enums/app-extra-category.enum';
import { Role } from 'app/enums/role.enum';
import { helptextApps } from 'app/helptext/apps/apps';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { AppsFiltersDialogComponent } from 'app/pages/apps/components/available-apps/apps-filters-dialog/apps-filters-dialog.component';
import { AppsFilterStore } from 'app/pages/apps/store/apps-filter-store.service';
import { AppsStore } from 'app/pages/apps/store/apps-store.service';
import { InstalledAppsStore } from 'app/pages/apps/store/installed-apps-store.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-available-apps-header',
  templateUrl: './available-apps-header.component.html',
  styleUrls: ['./available-apps-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    IxInputComponent,
    MatButton,
    MatAnchor,
    MatDialogModule,
    TnIconComponent,
    TranslateModule,
    NgxSkeletonLoaderModule,
    AsyncPipe,
    TestDirective,
    RequiresRolesDirective,
    RouterLink,
  ],
})
export class AvailableAppsHeaderComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private cdr = inject(ChangeDetectorRef);
  private dialogService = inject(DialogService);
  private matDialog = inject(MatDialog);
  private viewContainerRef = inject(ViewContainerRef);
  private injector = inject(Injector);
  protected applicationsStore = inject(AppsStore);
  protected appsFilterStore = inject(AppsFilterStore);
  protected installedAppsStore = inject(InstalledAppsStore);
  private errorHandler = inject(ErrorHandlerService);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.AppsWrite, Role.CatalogWrite];

  searchControl = this.fb.control('');
  availableApps$ = this.applicationsStore.availableApps$;
  areLoaded$ = new BehaviorSubject(false);
  installedApps$ = this.installedAppsStore.installedApps$;
  isFilterApplied$ = this.appsFilterStore.isFilterApplied$;

  readonly AppExtraCategory = AppExtraCategory;

  ngOnInit(): void {
    this.searchControl.valueChanges.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((searchQuery) => {
      this.appsFilterStore.applySearchQuery(searchQuery || '');
    });

    this.appsFilterStore.searchQuery$.pipe(take(1), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (searchQuery) => {
        this.searchControl.setValue(searchQuery);
      },
    });
    this.applicationsStore.isLoading$.pipe(
      filter((value) => !value),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.areLoaded$.next(true);
    });
  }

  refreshCatalog(): void {
    this.dialogService.jobDialog(
      this.api.job('catalog.sync'),
      {
        title: this.translate.instant(helptextApps.refreshing),
        canMinimize: true,
      },
    )
      .afterClosed()
      .pipe(
        this.errorHandler.withErrorHandler(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.applicationsStore.initialize();
        this.installedAppsStore.initialize();
        this.cdr.markForCheck();
      });
  }

  changeFiltersVisible(): void {
    this.appsFilterStore.filterValues$.pipe(take(1)).subscribe((filterValues) => {
      this.matDialog.open(AppsFiltersDialogComponent, {
        data: {
          sort: filterValues?.sort || null,
          categories: filterValues?.categories || [],
          appsFilterStore: this.appsFilterStore,
        },
        width: '600px',
        injector: this.injector,
        viewContainerRef: this.viewContainerRef,
      });
    });
  }

  protected readonly tnIconMarker = tnIconMarker;
}
