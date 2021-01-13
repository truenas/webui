import { Component, OnChanges, OnInit, ViewChild, Input } from '@angular/core';
import { Router } from '@angular/router';
import { T } from 'app/translate-marker';
import { Subscription } from 'rxjs';
import { RestService, WebSocketService, SystemGeneralService } from '../../services/';

@Component({
  selector: 'services-table',
  template: `<entity-table [conf]="this"></entity-table>`,
  styleUrls: ['./services-table.component.css']
})
export class ServicesTableComponent implements OnInit {
  @Input() conf: any;

  public isFooterConsoleOpen: boolean;
  private getAdvancedConfig: Subscription;
  protected queryCall = 'service.query';
  protected queryCallOption = [[], { "order_by": ["service"] }];
  
  public columns: Array<any> = [
    { name: 'Label', prop: 'label' },
    { name: 'Running', prop: 'state', state: 'state' },
    { name: 'Start Automatically', prop: 'enable', selectable: true, toggle: true },
  ];
  
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
    multiSelect: false,
  };

  constructor(protected router: Router, protected rest: RestService, protected ws: WebSocketService,
    private sysGeneralService: SystemGeneralService) {}

    
  resourceTransformIncomingRestData(data) {
    let hidden = ['netdata'];
    
    data.forEach((item) => {
      item.title = item.service;
      if (!hidden.includes(item.service)) {
        if (this.conf.name_MAP[item.service]) {
          item.label = this.conf.name_MAP[item.service];
        } else {
          item.label = item.service;
        }
      }
    });
        
    return data;
  }
  
  ngOnInit() {
    this.getAdvancedConfig = this.sysGeneralService.getAdvancedConfig.subscribe((res)=> {
      if (res) {
        this.isFooterConsoleOpen = res.consolemsg;
        this.getAdvancedConfig.unsubscribe();
      }
    });
  }
  
  getActions(parentRow) {
    const actions = [{
      name: parentRow.service,
      icon: parentRow.state != 'RUNNING' ? "play_arrow" : "stop",
      id: 'toggle',
      label: parentRow.state != 'RUNNING' ? T("Start") : T("Stop"),
      onClick: (row) => {
        this.conf.toggle(row);
      }
    },
    {
      name: parentRow.service,
      icon: 'configure',
      id: "Configure",
      label: T("Configure"),
      onClick: (row) => {
        console.log('row', row);
        this.conf.editService(row.service);
      }
    }];
    if (parentRow.service === 'netdata' && parentRow.state === 'RUNNING') {
      actions.push({
        name: 'launch',
        icon: 'launch',
        id: 'Launch',
        label: T('Launch'),
        onClick: () => {
          this.conf.openNetdataPortal()
        }
      })
    }
    return actions;
  }
}
