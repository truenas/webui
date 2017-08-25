import { Component, OnInit, Input, ElementRef, ViewEncapsulation, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { DataSource } from '@angular/cdk';
import { MdPaginator, MdSort } from '@angular/material';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Subscription } from 'rxjs';

import 'rxjs/add/operator/startWith';
import 'rxjs/add/observable/merge';
import 'rxjs/add/operator/map';

//local libs
import { GlobalState } from '../../../../global.state';
import { RestService, DialogService } from '../../../../services/';
import { EntityUtils } from '../utils';

@Component({
  selector: 'entity-table',
  templateUrl: './entity-table.component.html',
  styleUrls: ['./entity-table.component.css'],
  providers: [DialogService]
})
export class EntityTableComponent implements OnInit {

  @Input('conf') conf: any;

  public busy: Subscription;

  public rows: Array < any > = [];
  public columns: Array < any > = [];
  public page: number = 1;
  public itemsPerPage: number = 10;
  public maxSize: number = 5;
  public numPages: number = 1;
  public length: number = 0;
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
  };

  constructor(protected rest: RestService, protected router: Router,
    protected _state: GlobalState, protected _eRef: ElementRef, private dialog: DialogService) {}

  ngOnInit() {
    if (this.conf.preInit) {
      this.conf.preInit(this);
    }
    this.getData();
    if (this.conf.afterInit) {
      this.conf.afterInit(this);
    }
  }

  getData() {
    let offset = this.itemsPerPage * (this.page - 1);
    let sort: Array < String > = [];
    let options: Object = new Object();

    for (let i in this.config.sorting.columns) {
      let col = this.config.sorting.columns[i];
      if (col.sort == 'asc') {
        sort.push(col.name);
      } else if (col.sort == 'desc') {
        sort.push('-' + col.name);
      }
    }

    // options = {limit: this.itemsPerPage, offset: offset};
    options = { limit: 0 };
    if (sort.length > 0) {
      options['sort'] = sort.join(',');
    }

    this.busy =
      this.rest.get(this.conf.resource_name, options).subscribe((res) => {
        this.length = res.total;
        this.rows = new EntityUtils().flattenData(res.data);
        if (this.conf.dataHandler) {
          this.conf.dataHandler(this);
        }
      });
  }

  onChangeTable(
    config,
    page: any = { page: this.page, itemsPerPage: this.itemsPerPage }) {
    if (config.filtering) {
      Object.assign(this.config.filtering, config.filtering);
    }
    if (config.sorting) {
      Object.assign(this.config.sorting, config.sorting);
    }
    this.page = page.page;
    this.getData();
  }

  trClass(row) {
    let classes = [];
    classes.push('treegrid-' + row.id);
    if (row._parent) {
      classes.push('treegrid-parent-' + row._parent);
    }
    return classes.join(' ');
  }

  getActions(row) {
    if (this.conf.getActions) {
      return this.conf.getActions(row);
    } else {
      return [{
        id: "edit",
        label: "Edit",
        onClick: (row) => { this.doEdit(row.id); },
      }, {
        id: "delete",
        label: "Delete",
        onClick: (row) => { this.doDelete(row.id); },
      }, ]
    }
  }

  getAddActions() {
    if (this.conf.getAddActions) {
      return this.conf.getAddActions();
    } else {
      return [];
    }
  }

  rowValue(row, attr) {
    if (this.conf.rowValue) {
      return this.conf.rowValue(row, attr);
    }
    return row[attr];
  }

  doAdd() {
    this.router.navigate(new Array('/pages').concat(this.conf.route_add));
  }

  doEdit(id) {
    this.router.navigate(
      new Array('/pages').concat(this.conf.route_edit).concat(id));
  }

  doDelete(id) {
    this.dialog.confirm("Delete", "Are you sure you want to delete it?").subscribe((res) => {
      if (res) {
        let data = {};
        this.busy = this.rest.delete(this.conf.resource_name + '/' + id, data).subscribe(
          (res) => {
            // if (this.conf.route_success) {
            //   this.router.navigate(new Array('/pages').concat(this.conf.route_success));
            // }else {
            //   location.reload();
            // }
            //fix me
            // because this is the same route, 
            // the add a new parameter way 
            // to trick the route to refresh way doesn't work
            // yet
            location.reload();
          },
          (res) => { new EntityUtils().handleError(this, res); }
        );
      }
    })
  }
}
