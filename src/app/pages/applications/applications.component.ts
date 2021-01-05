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

  constructor(private appService: ApplicationsService, private core: CoreService, 
    private modalService: ModalService) { }

  ngOnInit(): void {
    this.setupToolbar();
  }

  setupToolbar() {
    this.settingsEvent = new Subject();
    this.settingsEvent.subscribe((evt: CoreEvent) => {
      this.catalogTab.onToolbarAction(evt);
      this.chartTab.onToolbarAction(evt);    
    })

    const settingsConfig = {
      actionType: EntityToolbarComponent,
      actionConfig: {
        target: this.settingsEvent,
        controls: [
          {
            name: 'filter',
            type: 'input',
            value: 'value',
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
          {
            name: 'launch',
            label: helptext.launch,
            type: 'button',
            color: 'primary',
            value: 'launch'
          },
          {
            name: 'bulk',
            label: 'Bulk Options',
            type: 'button',
            color: 'primary',
            value: 'bulk'
          }
        ]
      }
    };

    this.core.emit({name:"GlobalActions", data: settingsConfig, sender: this});
  }

  newTab(index: number) {
    this.selectedIndex = index;
  }

  refresh(e) {
    if (e.index === 1) {
      this.modalService.refreshTable();
    }
  }
}
