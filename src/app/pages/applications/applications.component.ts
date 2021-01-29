import { Component, OnInit, ViewChild } from '@angular/core';
import { ApplicationsService } from './applications.service';
import { ModalService } from '../../services/modal.service';
import { EntityToolbarComponent } from 'app/pages/common/entity/entity-toolbar/entity-toolbar.component';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { CatalogComponent } from './catalog/catalog.component';
import { ChartReleasesComponent } from './chart-releases/chart-releases.component';
import { Subject, Subscription } from 'rxjs';
import  helptext  from '../../helptext/apps/apps';
@Component({
  selector: 'app-applications',
  templateUrl: './applications.component.html',
  styleUrls: ['./applications.component.scss']
})

export class ApplicationsComponent implements OnInit {

  @ViewChild(CatalogComponent, { static: false}) private catalogTab: CatalogComponent;
  @ViewChild(ChartReleasesComponent, { static: false}) private chartTab: ChartReleasesComponent;

  selectedIndex = 0;
  public settingsEvent: Subject<CoreEvent>;
  public filterString = '';
  isShowBulkOptions = true;

  constructor(private appService: ApplicationsService, private core: CoreService, 
    private modalService: ModalService) { }

  ngOnInit(): void {
    this.setupToolbar();
  }

  setupToolbar() {
    this.settingsEvent = new Subject();
    this.settingsEvent.subscribe((evt: CoreEvent) => {
      if (evt.data.event_control == 'filter') {
        this.filterString = evt.data.filter;
      }

      this.catalogTab.onToolbarAction(evt);
      this.chartTab.onToolbarAction(evt);    
    })

    let controls: any[] = [      
      {
        name: 'filter',
        type: 'input',
        value: this.filterString,
      },
      {
        name: 'settings',
        label: helptext.settings,
        type: 'menu',
        options: [
          { label: helptext.choose, value: 'select_pool' }, 
          { label: helptext.advanced, value: 'advanced_settings' }, 
        ]
      },
    ];

    if (this.selectedIndex == 1 && this.isShowBulkOptions) {
      controls.push({
        name: 'bulk',
        label: 'Bulk Options',
        type: 'button',
        color: 'secondary',
        value: 'bulk'
      });
    }
    
    controls.push({
      name: 'launch',
      label: helptext.launch,
      type: 'button',
      color: 'primary',
      value: 'launch'
    });

    const settingsConfig = {
      actionType: EntityToolbarComponent,
      actionConfig: {
        target: this.settingsEvent,
        controls: controls,
      }
    };

    this.core.emit({name:"GlobalActions", data: settingsConfig, sender: this});
  }

  newTab(index: number) {
    if (index < 2) {
      this.selectedIndex = index;
    } else if (index == 2) {
      this.isShowBulkOptions = true;
      this.setupToolbar();
    } else if (index == 3) {
      this.isShowBulkOptions = false;
      this.setupToolbar();
    }
    
  }

  refresh(e) {
    this.selectedIndex = e.index;
    this.setupToolbar();
    if (this.selectedIndex === 1) {
      this.modalService.refreshTable();
    }
  }
}
