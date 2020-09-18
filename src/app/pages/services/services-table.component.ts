import { Component, OnChanges, OnInit, ViewChild, Input } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { RestService, WebSocketService, SystemGeneralService } from '../../services/';

@Component({
  selector: 'services-table',
  templateUrl: './services-table.component.html',
  styleUrls: ['./services-table.component.css']
})
export class ServicesTableComponent implements OnChanges, OnInit {

  @Input() conf: any;
  @Input() data: any[];
  @ViewChild('datatable', { static: true}) datatable;


  public columns: Array < any > = [
    { name: 'Running', prop: 'state' },
    { name: 'Label', prop: 'label' },
    { name: 'Enable', prop: 'enable' },
    { name: 'Actions', prop: 'cardActions' }
  ];

  public pageSize:number = 12;
  public minPageSize: number = 3;
  public baseWindowHeight: number = 910;
  public tableHeight:number;
  public isFooterConsoleOpen: boolean;
  private getAdvancedConfig: Subscription;

  constructor(protected router: Router, protected rest: RestService, protected ws: WebSocketService,
    private sysGeneralService: SystemGeneralService) {}

  ngOnInit() {
    this.findPageSize();
    
    window.onresize = () => {
      this.findPageSize()
    }

    this.getAdvancedConfig = this.sysGeneralService.getAdvancedConfig.subscribe((res)=> {
      if (res) {
        this.isFooterConsoleOpen = res.consolemsg;
        this.setTableHeight(this.datatable);
        this.getAdvancedConfig.unsubscribe();
      }
    });
  }

  findPageSize() {
    let x = window.innerHeight - this.baseWindowHeight;
    this.pageSize = 12 + (Math.floor(x/50));
    if (this.pageSize < this.minPageSize) {
      this.pageSize = this.minPageSize;
    }
    this.setTableHeight(this.datatable);
  }

  ngOnChanges(changes) {
    if(changes.data){
      let newData = Object.assign(this.data,{});
      this.data = newData;
    }
    if (this.datatable) {
      this.datatable.limit = this.pageSize; // items per page
      this.datatable.recalculate();
      this.setTableHeight(this.datatable);
    }
  }

  setTableHeight(t){
    if (this.isFooterConsoleOpen) {
      this.tableHeight = (50*this.pageSize) + 50  
    } else {
      this.tableHeight = (50*this.pageSize) + 100;
    }
  }
}
