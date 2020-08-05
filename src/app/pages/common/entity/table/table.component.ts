import { Component, OnInit } from '@angular/core';
import { WebSocketService } from 'app/services';

export interface InputTableConf {
    columns:any[];
    queryCall?: string;
    queryCallOption?: any;
}

@Component({
    selector: 'app-table',
    templateUrl: './table.component.html',
})
export class TableComponent implements OnInit{
    public dataSource;
    public columns: Array<any> = [
        {name : 'Name', prop : 'name'},
        {name : 'Link State', prop : 'link_state'},
        {name : 'IP Addresses', prop : 'addresses'},
      ];
    public displayedColumns = this.columns.map(col => col.prop);
   

      queryCall = 'interface.query';


      constructor(private ws: WebSocketService) {}
      ngOnInit() {
          console.log(this.displayedColumns);
          
          this.ws.call(this.queryCall).subscribe(res => {
              console.log(res);
              this.dataSource = res;
          })
      }
}