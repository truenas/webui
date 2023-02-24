import {
  Component, ChangeDetectionStrategy, OnInit, ChangeDetectorRef,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { EmptyType } from 'app/enums/empty-type.enum';
import helptext from 'app/helptext/apps/apps';
import { ChartRelease } from 'app/interfaces/chart-release.interface';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';

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
  title = '';

  constructor(
    private appService: ApplicationsService,
    private cdr: ChangeDetectorRef,
  ) {}

  get allAppsChecked(): boolean {
    return this.dataSource.every((app) => app.selected);
  }

  ngOnInit(): void {
    this.updateChartReleases();
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

  showLoadStatus(type: EmptyType): void {
    let title = '';

    switch (type) {
      case EmptyType.Loading:
        title = helptext.message.loading;
        break;
      case EmptyType.FirstUse:
        title = helptext.message.not_configured;
        break;
      case EmptyType.NoSearchResults:
        title = helptext.message.no_search_result;
        break;
      case EmptyType.NoPageData:
        title = helptext.message.no_installed;
        break;
      case EmptyType.Errors:
        title = helptext.message.not_running;
        break;
    }

    this.title = title;
  }

  updateChartReleases(): void {
    this.isLoading = true;
    this.showLoadStatus(EmptyType.Loading);
    this.appService.getKubernetesConfig().pipe(untilDestroyed(this)).subscribe((config) => {
      if (!config.pool) {
        this.dataSource = [];
        this.showLoadStatus(EmptyType.FirstUse);
        this.isLoading = false;
        this.cdr.markForCheck();
      } else {
        this.appService.getKubernetesServiceStarted().pipe(untilDestroyed(this)).subscribe((kubernetesStarted) => {
          if (!kubernetesStarted) {
            this.dataSource = [];
            this.showLoadStatus(EmptyType.Errors);
            this.isLoading = false;
            this.cdr.markForCheck();
          } else {
            this.appService.getChartReleases().pipe(untilDestroyed(this)).subscribe((charts) => {
              if (charts.length) {
                this.dataSource = charts;
              } else {
                this.showLoadStatus(EmptyType.NoPageData);
              }
              this.isLoading = false;
              this.cdr.markForCheck();
            });
          }
        });
      }
    });
  }
}
