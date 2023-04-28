import {
  Component, OnInit, ViewChild, ViewEncapsulation, AfterViewInit,
} from '@angular/core';
import { MatTabGroup } from '@angular/material/tabs';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { merge } from 'rxjs';
import { ApplicationUserEvent, ApplicationUserEventName } from 'app/interfaces/application.interface';
import { ApplicationTab } from 'app/pages/apps-old/application-tab.enum';
import { ApplicationsService } from 'app/pages/apps-old/applications.service';
import { CoreService } from 'app/services/core-service/core.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { CatalogComponent } from './catalog/catalog.component';
import { ChartReleasesComponent } from './chart-releases/chart-releases.component';
import { ManageCatalogsComponent } from './manage-catalogs/manage-catalogs.component';

@UntilDestroy()
@Component({
  templateUrl: './applications.component.html',
  styleUrls: ['./applications.component.scss'],
  // eslint-disable-next-line @angular-eslint/use-component-view-encapsulation
  encapsulation: ViewEncapsulation.None,
})
export class ApplicationsComponent implements OnInit, AfterViewInit {
  @ViewChild(ChartReleasesComponent, { static: false }) private chartTab: ChartReleasesComponent;
  @ViewChild(CatalogComponent, { static: false }) private catalogTab: CatalogComponent;
  @ViewChild(ManageCatalogsComponent, { static: false }) private manageCatalogTab: ManageCatalogsComponent;
  @ViewChild('tabs') tabGroup: MatTabGroup;

  isChooseInit = false;

  constructor(
    private core: CoreService,
    private slideInService: IxSlideInService,
    private appService: ApplicationsService,
  ) {}

  ngOnInit(): void {
    merge(
      this.core.register({ eventName: 'RefreshAppsTab', observerClass: this }),
      this.slideInService.onClose$,
    ).pipe(untilDestroyed(this)).subscribe(() => {
      this.refreshTab();
    });
  }

  ngAfterViewInit(): void {
    this.refreshTab();
    this.appService.getKubernetesConfig().pipe(untilDestroyed(this)).subscribe((config) => {
      if (!config.pool) {
        this.tabGroup.selectedIndex = ApplicationTab.AvailableApps;
      } else {
        this.isChooseInit = true;
      }
    });
  }

  updateTab(evt: ApplicationUserEvent): void {
    if (evt.name === ApplicationUserEventName.SwitchTab) {
      this.tabGroup.selectedIndex = evt.value as ApplicationTab;
    }
  }

  refreshTab(): void {
    switch (this.tabGroup.selectedIndex) {
      case ApplicationTab.InstalledApps:
        if (this.chartTab) {
          this.chartTab.refreshChartReleases();
        }
        break;
      case ApplicationTab.AvailableApps:
        if (this.catalogTab) {
          this.catalogTab.loadCatalogs();
          this.catalogTab.loadPoolSet();
          if (!this.isChooseInit) {
            this.catalogTab.commonAppsToolbarButtons.onChoosePool();
            this.isChooseInit = true;
          }
        }
        break;
      case ApplicationTab.Catalogs:
        if (this.manageCatalogTab) {
          this.manageCatalogTab.refresh();
        }
        break;
      case ApplicationTab.DockerImages:
        break;
    }
  }

  onTabSelected(): void {
    this.refreshTab();
  }
}
