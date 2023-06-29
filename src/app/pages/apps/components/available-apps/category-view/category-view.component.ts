import {
  AfterViewInit,
  ChangeDetectionStrategy, Component, OnDestroy, OnInit, TemplateRef, ViewChild,
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
import { LayoutService } from 'app/services/layout.service';

@UntilDestroy()
@Component({
  templateUrl: './category-view.component.html',
  styleUrls: ['./category-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryViewComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('pageHeader') pageHeader: TemplateRef<unknown>;

  pageTitle$ = new BehaviorSubject('Category');
  apps$ = this.appsFilterStore.filteredApps$;
  isLoading$ = this.applicationsStore.isLoading$;

  constructor(
    private layoutService: LayoutService,
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

  ngAfterViewInit(): void {
    this.layoutService.pageHeaderUpdater$.next(this.pageHeader);
  }

  ngOnDestroy(): void {
    this.appsFilterStore.resetFilters();
  }

  trackByAppId(id: number, app: AvailableApp): string {
    return `${app.catalog}-${app.train}-${app.name}`;
  }
}
