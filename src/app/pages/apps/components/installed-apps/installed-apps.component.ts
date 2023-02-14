import {
  Component, ChangeDetectionStrategy, OnInit, ChangeDetectorRef,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ChartRelease } from 'app/interfaces/chart-release.interface';
import { ApplicationsService } from 'app/pages/apps-old/applications.service';

@UntilDestroy()
@Component({
  templateUrl: './installed-apps.component.html',
  styleUrls: ['./installed-apps.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstalledAppsComponent implements OnInit {
  dataSource: ChartRelease[] = [];
  selectedApp: ChartRelease;
  isLoading = false;
  filterString = '';

  constructor(
    private appService: ApplicationsService,
    private cdr: ChangeDetectorRef,
  ) {}

  get allAppsChecked(): boolean {
    return this.dataSource.every((app) => app.selected);
  }

  ngOnInit(): void {
    this.getReleases();
  }

  onSearch(query: string): void {
    this.filterString = query;
  }

  toggleAppsChecked(checked: boolean): void {
    this.dataSource.forEach((app) => app.selected = checked);
  }

  selectApp(app: ChartRelease): void {
    this.selectedApp = app;
  }

  getReleases(): void {
    this.isLoading = true;
    this.appService.getChartReleases().pipe(untilDestroyed(this)).subscribe((releases) => {
      this.dataSource = releases;
      this.isLoading = false;
      this.cdr.markForCheck();
    });
  }
}
