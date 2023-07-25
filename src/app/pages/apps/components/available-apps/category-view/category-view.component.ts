import {
  ChangeDetectionStrategy, Component, OnDestroy, OnInit,
} from '@angular/core';
import {
  ActivatedRoute,
} from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import {
  BehaviorSubject,
} from 'rxjs';
import { AvailableApp } from 'app/interfaces/available-app.interface';
import { AppsFilterStore } from 'app/pages/apps/store/apps-filter-store.service';
import { AppsStore } from 'app/pages/apps/store/apps-store.service';

@UntilDestroy()
@Component({
  templateUrl: './category-view.component.html',
  styleUrls: ['./category-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryViewComponent implements OnInit, OnDestroy {
  pageTitle$ = new BehaviorSubject('Category');
  apps$ = this.appsFilterStore.filteredApps$;
  isLoading$ = this.applicationsStore.isLoading$;

  constructor(
    private applicationsStore: AppsStore,
    private route: ActivatedRoute,
    private appsFilterStore: AppsFilterStore,
  ) {}

  ngOnInit(): void {
    const category = this.route.snapshot.params.category as string;
    this.pageTitle$.next(category.replace(/-/g, ' '));
    this.appsFilterStore.applyFilters({
      categories: [category],
      catalogs: [],
      sort: null,
    });
  }

  ngOnDestroy(): void {
    this.appsFilterStore.resetFilters();
  }

  trackByAppId(id: number, app: AvailableApp): string {
    return `${app.catalog}-${app.train}-${app.name}`;
  }
}
