import {
  Component, OnInit, ViewChild, ViewEncapsulation, AfterViewInit,
} from '@angular/core';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { merge } from 'rxjs';
import { ApplicationUserEvent, ApplicationUserEventName } from 'app/interfaces/application.interface';
import { ApplicationTab } from 'app/pages/applications/application-tab.enum';
import { ApplicationsService } from 'app/pages/applications/applications.service';
import { DockerImagesListComponent } from 'app/pages/applications/docker-images/docker-images-list/docker-images-list.component';
import { CoreService } from 'app/services/core-service/core.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { ModalService } from 'app/services/modal.service';
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
  @ViewChild(DockerImagesListComponent, { static: false }) private dockerImagesTab: DockerImagesListComponent;
  selectedTab = ApplicationTab.InstalledApps;
  isChooseInit = false;

  constructor(
    private core: CoreService,
    private modalService: ModalService,
    private slideInService: IxSlideInService,
    private appService: ApplicationsService,
  ) {}

  ngOnInit(): void {
    merge(
      this.core.register({ eventName: 'RefreshAppsTab', observerClass: this }),
      this.slideInService.onClose$,
      this.modalService.refreshTable$,
    ).pipe(untilDestroyed(this)).subscribe(() => {
      this.refreshTab();
    });
  }

  ngAfterViewInit(): void {
    this.refreshTab();
    this.appService.getKubernetesConfig().pipe(untilDestroyed(this)).subscribe((config) => {
      if (!config.pool) {
        this.selectedTab = ApplicationTab.AvailableApps;
      } else {
        this.isChooseInit = true;
      }
    });
  }

  updateTab(evt: ApplicationUserEvent): void {
    if (evt.name === ApplicationUserEventName.SwitchTab) {
      this.selectedTab = evt.value as ApplicationTab;
    }
  }

  refreshTab(): void {
    switch (this.selectedTab) {
      case ApplicationTab.InstalledApps:
        this.chartTab.refreshChartReleases();
        break;
      case ApplicationTab.AvailableApps:
        this.catalogTab.loadCatalogs();
        this.catalogTab.loadPoolSet();
        if (!this.isChooseInit) {
          this.catalogTab.commonAppsToolbarButtons.onChoosePool();
          this.isChooseInit = true;
        }
        break;
      case ApplicationTab.Catalogs:
        this.manageCatalogTab.refresh();
        break;
      case ApplicationTab.DockerImages:
        break;
    }
  }

  onTabSelected(event: MatTabChangeEvent): void {
    this.selectedTab = event.index;
    this.refreshTab();
  }
}
