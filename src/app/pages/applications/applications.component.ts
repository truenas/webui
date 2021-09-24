import {
  Component, OnInit, ViewChild, ViewEncapsulation, AfterViewInit,
} from '@angular/core';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Subject } from 'rxjs';
import { CommonUtils } from 'app/core/classes/common-utils';
import { CoreService } from 'app/core/services/core-service/core.service';
import helptext from 'app/helptext/apps/apps';
import { ApplicationUserEvent, ApplicationUserEventName } from 'app/interfaces/application.interface';
import { CoreEvent } from 'app/interfaces/events';
import { Option } from 'app/interfaces/option.interface';
import { EntityToolbarComponent } from 'app/pages/common/entity/entity-toolbar/entity-toolbar.component';
import { ToolbarConfig } from 'app/pages/common/entity/entity-toolbar/models/control-config.interface';
import { ModalService } from 'app/services/modal.service';
import { ApplicationsService } from './applications.service';
import { CatalogComponent } from './catalog/catalog.component';
import { ChartReleasesComponent } from './chart-releases/chart-releases.component';
import { DockerImagesComponent } from './docker-images/docker-images.component';
import { ManageCatalogsComponent } from './manage-catalogs/manage-catalogs.component';

@UntilDestroy()
@Component({
  selector: 'app-applications',
  templateUrl: './applications.component.html',
  styleUrls: ['./applications.component.scss'],
  // eslint-disable-next-line @angular-eslint/use-component-view-encapsulation
  encapsulation: ViewEncapsulation.None,
})
export class ApplicationsComponent implements OnInit, AfterViewInit {
  @ViewChild(ChartReleasesComponent, { static: false }) private chartTab: ChartReleasesComponent;
  @ViewChild(CatalogComponent, { static: false }) private catalogTab: CatalogComponent;
  @ViewChild(ManageCatalogsComponent, { static: false }) private manageCatalogTab: ManageCatalogsComponent;
  @ViewChild(DockerImagesComponent, { static: false }) private dockerImagesTab: DockerImagesComponent;
  selectedIndex = 0;
  isSelectedOneMore = false;
  isSelectedAll = false;
  isSelectedPool = false;
  settingsEvent$: Subject<CoreEvent>;
  filterString = '';
  toolbarConfig: ToolbarConfig;
  catalogOptions: Option[] = [];
  selectedCatalogOptions: Option[] = [];
  protected utils: CommonUtils;

  constructor(
    private appService: ApplicationsService,
    private core: CoreService,
    private aroute: ActivatedRoute,
    private modalService: ModalService,
  ) {
    this.utils = new CommonUtils();
  }

  ngOnInit(): void {
    this.setupToolbar();

    this.modalService.refreshTable$.pipe(untilDestroyed(this)).subscribe(() => {
      this.refreshTab();
    });
  }

  ngAfterViewInit(): void {
    this.refreshTab();
  }

  setupToolbar(): void {
    this.settingsEvent$ = new Subject();
    this.settingsEvent$.pipe(untilDestroyed(this)).subscribe((evt: CoreEvent) => {
      if (evt.data.event_control == 'filter') {
        this.filterString = evt.data.filter;
      }

      this.chartTab.onToolbarAction(evt);
      this.catalogTab.onToolbarAction(evt);
      this.manageCatalogTab.onToolbarAction(evt);
      this.dockerImagesTab.onToolbarAction(evt);
    });

    const controls = [
      {
        name: 'filter',
        type: 'input',
        value: this.filterString,
      },
    ];

    const toolbarConfig = {
      target: this.settingsEvent$,
      controls,
    };
    const settingsConfig = {
      actionType: EntityToolbarComponent,
      actionConfig: toolbarConfig,
    };

    this.toolbarConfig = toolbarConfig;

    this.core.emit({ name: 'GlobalActions', data: settingsConfig, sender: this });
  }

  updateToolbar(): void {
    this.toolbarConfig.controls.splice(1);
    const search = this.toolbarConfig.controls[0];

    // TODO: Error prone if index is changed
    switch (this.selectedIndex) {
      case 0:
        search.placeholder = helptext.installedPlaceholder;
        const bulk = {
          name: 'bulk',
          label: helptext.bulkActions.title,
          type: 'menu',
          options: helptext.bulkActions.options,
        };
        if (this.isSelectedAll) {
          bulk.options[0].label = helptext.bulkActions.unSelectAll;
        } else {
          bulk.options[0].label = helptext.bulkActions.selectAll;
        }
        bulk.options.forEach((option) => {
          if (option.value != 'select_all') {
            option.disabled = !this.isSelectedOneMore;
          }
        });
        this.toolbarConfig.controls.push(bulk);
        break;
      case 1:
        search.placeholder = helptext.availablePlaceholder;
        this.toolbarConfig.controls.push({
          name: 'refresh_all',
          label: helptext.refresh,
          type: 'button',
          color: 'secondary',
          value: 'refresh_all',
        });

        this.toolbarConfig.controls.push({
          type: 'multimenu',
          name: 'catalogs',
          label: helptext.catalogs,
          disabled: false,
          multiple: true,
          options: this.catalogOptions,
          value: this.selectedCatalogOptions,
          customTriggerValue: helptext.catalogs,
        });
        break;
      case 2:
        search.placeholder = helptext.catalogPlaceholder;
        this.toolbarConfig.controls.push({
          name: 'refresh_catalogs',
          label: helptext.refresh,
          type: 'button',
          color: 'secondary',
          value: 'refresh_catalogs',
        });
        this.toolbarConfig.controls.push({
          name: 'add_catalog',
          label: helptext.addCatalog,
          type: 'button',
          color: 'secondary',
          value: 'add_catalog',
        });
        break;
      case 3:
        search.placeholder = helptext.dockerPlaceholder;
        this.toolbarConfig.controls.push({
          name: 'pull_image',
          label: helptext.pullImage,
          type: 'button',
          color: 'secondary',
          value: 'pull_image',
        });
        break;
    }

    const setting = {
      name: 'settings',
      label: helptext.settings,
      type: 'menu',
      options: [
        { label: helptext.choose, value: 'select_pool' },
        { label: helptext.advanced, value: 'advanced_settings' },
      ],
    };

    if (this.isSelectedPool) {
      if (setting.options.length == 2) {
        const unsetOption = {
          label: helptext.unset_pool,
          value: 'unset_pool',
        };
        setting.options.push(unsetOption);
      }
    } else if (setting.options.length == 3) {
      setting.options = setting.options.filter((ctl) => ctl.label !== helptext.unset_pool);
    }
    this.toolbarConfig.controls.push(setting);

    this.toolbarConfig.controls.push({
      name: 'launch',
      label: helptext.launch,
      type: 'button',
      color: 'primary',
      value: 'launch',
      disabled: !this.isSelectedPool,
    });

    this.toolbarConfig.target.next({ name: 'UpdateControls', data: this.toolbarConfig.controls });
  }

  updateTab(evt: ApplicationUserEvent): void {
    if (evt.name == ApplicationUserEventName.SwitchTab) {
      this.selectedIndex = evt.value as number;
    } else if (evt.name == ApplicationUserEventName.UpdateToolbar) {
      this.isSelectedOneMore = evt.value as boolean;
      this.isSelectedAll = evt.isSelectedAll;
      this.updateToolbar();
    } else if (evt.name == ApplicationUserEventName.CatalogToolbarChanged) {
      this.isSelectedPool = evt.value as boolean;
      this.catalogOptions = evt.catalogNames.map((catalogName: string) => ({
        label: this.utils.capitalizeFirstLetter(catalogName),
        value: catalogName,
      }));
      this.selectedCatalogOptions = this.catalogOptions;

      this.updateToolbar();
    }
  }

  refreshTab(): void {
    this.updateToolbar();
    if (this.selectedIndex == 0) {
      this.chartTab.refreshChartReleases();
    } else if (this.selectedIndex == 1) {
      this.catalogTab.loadCatalogs();
    } else if (this.selectedIndex == 2) {
      this.manageCatalogTab.refresh();
    } else if (this.selectedIndex == 3) {
      this.dockerImagesTab.refresh();
    }
  }

  refresh(e: MatTabChangeEvent): void {
    this.selectedIndex = e.index;
    this.refreshTab();
  }
}
