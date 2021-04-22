import {
  Component, OnChanges, OnInit, ViewChild, Input,
} from '@angular/core';
import { Router } from '@angular/router';
import { RestService, WebSocketService } from '../../services';

@Component({
  selector: 'services-table',
  templateUrl: './services-table.component.html',
  styleUrls: ['./services-table.component.css'],
})
export class ServicesTableComponent implements OnChanges, OnInit {
  @Input() conf: any;
  @Input() data: any[];
  @ViewChild('datatable', { static: true }) datatable;

  columns: any[] = [
    { name: 'Running', prop: 'state' },
    { name: 'Label', prop: 'label' },
    { name: 'Enable', prop: 'enable' },
    { name: 'Actions', prop: 'cardActions' },
  ];

  pageSize = 12;
  minPageSize = 3;
  baseWindowHeight = 910;
  tableHeight: number;
  isFooterConsoleOpen: boolean;

  constructor(protected router: Router, protected rest: RestService, protected ws: WebSocketService) {}

  ngOnInit() {
    this.findPageSize();

    window.onresize = () => {
      this.findPageSize();
    };

    this.ws.call('system.advanced.config').subscribe((res) => {
      if (res) {
        this.isFooterConsoleOpen = res.consolemsg;
        this.setTableHeight(this.datatable);
      }
    });
  }

  findPageSize() {
    const x = window.innerHeight - this.baseWindowHeight;
    this.pageSize = 12 + (Math.floor(x / 50));
    if (this.pageSize < this.minPageSize) {
      this.pageSize = this.minPageSize;
    }
    this.setTableHeight(this.datatable);
  }

  ngOnChanges(changes) {
    if (changes.data) {
      const newData = Object.assign(this.data, {});
      this.data = newData;
    }
    if (this.datatable) {
      this.datatable.limit = this.pageSize; // items per page
      this.datatable.recalculate();
      this.setTableHeight(this.datatable);
    }
  }

  setTableHeight(t) {
    if (this.isFooterConsoleOpen) {
      this.tableHeight = (50 * this.pageSize) + 50;
    } else {
      this.tableHeight = (50 * this.pageSize) + 100;
    }
  }
}
