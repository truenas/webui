import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, OnInit, Output,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { forkJoin, of, switchMap } from 'rxjs';
import { Catalog, CatalogApp } from 'app/interfaces/catalog.interface';
import { ChartRelease } from 'app/interfaces/chart-release.interface';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { catalogToAppsTransform } from 'app/pages/apps/utils/catalog-to-apps-transform';

@UntilDestroy()
@Component({
  selector: 'ix-available-apps-header',
  templateUrl: './available-apps-header.component.html',
  styleUrls: ['./available-apps-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvailableAppsHeaderComponent implements OnInit {
  @Output() searchQuery = new EventEmitter<string>();

  searchControl = this.fb.control('');

  isLoading = false;
  showFilters = false;
  availableApps: CatalogApp[] = [];
  installedApps: ChartRelease[] = [];
  installedCatalogs: Catalog[] = [];

  constructor(
    private appService: ApplicationsService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadData();

    this.searchControl.valueChanges.pipe(untilDestroyed(this)).subscribe((query) => {
      this.searchQuery.emit(query);
    });
  }

  loadData(): void {
    this.isLoading = true;
    forkJoin([
      this.appService.getAllCatalogs(),
      this.appService.getChartReleases(),
    ]).pipe(
      switchMap(([catalogs, releases]) => {
        this.installedApps = releases;
        this.installedCatalogs = catalogs;
        return of(catalogs);
      }),
      catalogToAppsTransform(),
      untilDestroyed(this),
    ).subscribe((apps) => {
      this.availableApps = apps;
      this.isLoading = false;
      this.cdr.markForCheck();
    });
  }

  changeFiltersVisible(): void {
    this.showFilters = !this.showFilters;
  }
}
