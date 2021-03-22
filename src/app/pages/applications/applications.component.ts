import { Component, OnInit, ViewChild } from '@angular/core';
import { ApplicationsService } from './applications.service';
import { ModalService } from '../../services/modal.service';
import { EntityToolbarComponent } from 'app/pages/common/entity/entity-toolbar/entity-toolbar.component';
import { ToolbarConfig } from 'app/pages/common/entity/entity-toolbar/models/control-config.interface';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { CatalogComponent } from './catalog/catalog.component';
import { ChartReleasesComponent } from './chart-releases/chart-releases.component';
import { Subject, Subscription } from 'rxjs';
import  helptext  from '../../helptext/apps/apps';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-applications',
  templateUrl: './applications.component.html',
  styleUrls: ['./applications.component.scss']
})

export class ApplicationsComponent implements OnInit {

  @ViewChild(CatalogComponent, { static: false}) private catalogTab: CatalogComponent;
  @ViewChild(ChartReleasesComponent, { static: false}) private chartTab: ChartReleasesComponent;

  selectedIndex: number = 0;
  isSelectedOneMore = false;
  isSelectedAll = false;
  isSelectedPool = false;
  public settingsEvent: Subject<CoreEvent>;
  public filterString = '';
  public toolbarConfig: ToolbarConfig;

  constructor(private appService: ApplicationsService, 
    private core: CoreService, 
    protected aroute: ActivatedRoute,
    private modalService: ModalService) { }

  ngOnInit(): void {    
    this.setupToolbar();
  }

  ngAfterViewInit() {
    //If the route parameter "tabIndex" is 1, switch tab to "Installed applications".
    this.aroute.params.subscribe(params => {
      if (params['tabIndex'] == 1) {
        this.selectedIndex = 1;
        this.refresh({index: 1});
      }
    });
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

    
    controls.push({
      name: 'launch',
      label: helptext.launch,
      type: 'button',
      color: 'primary',
      value: 'launch'
    });

    const toolbarConfig = {
      target: this.settingsEvent,
      controls: controls,
    }
    const settingsConfig = {
      actionType: EntityToolbarComponent,
      actionConfig: toolbarConfig
    };

    this.toolbarConfig = toolbarConfig;

    this.core.emit({name:"GlobalActions", data: settingsConfig, sender: this});

  }

  updateToolbar() {
   
    if (this.selectedIndex == 1) {
      const bulkControl = this.toolbarConfig.controls.find(control => control.name=="bulk");
      if (!bulkControl) {
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

        bulk.options.forEach(option => {
          if (option.value != 'select_all') {
            option.disabled = !this.isSelectedOneMore;
          } 
        });

        this.toolbarConfig.controls.splice(1,0, bulk);
      } else {
        if (this.isSelectedAll) {
          bulkControl.options[0].label = helptext.bulkActions.unSelectAll;
        } else {
          bulkControl.options[0].label = helptext.bulkActions.selectAll;
        }

        bulkControl.options.forEach(option => {
          if (option.value != 'select_all') {
            option.disabled = !this.isSelectedOneMore;
          } 
        });
      }
    } else {
      this.toolbarConfig.controls = this.toolbarConfig.controls.filter(ctl => ctl.name !== 'bulk');
    }

    const settingControl = this.toolbarConfig.controls.find(control => control.name=="settings");

    if (this.isSelectedPool) {
      if (settingControl.options.length == 2) {
        const unsetOption = {
          label: helptext.unset_pool, 
          value: 'unset_pool'
        };
        settingControl.options.push(unsetOption);
      }
    } else {
      if (settingControl.options.length == 3) {
        settingControl.options = settingControl.options.filter(ctl => ctl.label !== helptext.unset_pool);
      }
    }
 
    this.toolbarConfig.target.next({name:"UpdateControls", data: this.toolbarConfig.controls});
  }

  updateTab(evt) {
    if (evt.name == 'SwitchTab') {
      this.selectedIndex = evt.value;
    } else if (evt.name == 'UpdateToolbar') {
      this.isSelectedOneMore = evt.value;
      this.isSelectedAll = evt.isSelectedAll;
      this.updateToolbar();
    } else if (evt.name == 'UpdateToolbarPoolOption') {
      this.isSelectedPool = evt.value;
      this.updateToolbar();
    }
  }

  refresh(e) {
    this.selectedIndex = e.index;
    this.updateToolbar();
    if (this.selectedIndex === 1) {
      this.modalService.refreshTable();
    }
  }
}
