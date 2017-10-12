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
import { RestService } from '../../../../services/rest.service';
import { WebSocketService } from '../../../../services/ws.service';
import { DialogService } from '../../../../services/dialog.service';
import { EntityUtils } from '../utils';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';

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
  public getFunction;
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
  };
  protected loaderOpen: boolean = false;

  constructor(protected rest: RestService, protected router: Router, protected ws: WebSocketService,
    protected _eRef: ElementRef, private dialog: DialogService, protected loader: AppLoaderService) {}

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
    if (this.conf.queryCall) {
      this.getFunction = this.ws.call(this.conf.queryCall, []);
    } else {
      this.getFunction = this.rest.get(this.conf.resource_name, options);
    }
    this.busy =
      this.getFunction.subscribe((res) => {
        if (this.loaderOpen) {
          this.loader.close();
          this.loaderOpen = false;
        }
        if (res.data) {
          this.length = res.total;
          this.rows = new EntityUtils().flattenData(res.data);
        } else {
          this.length = res.length;
          this.rows = new EntityUtils().flattenData(res);
        }
        if (this.conf.dataHandler) {
          this.conf.dataHandler(this);
        }
        for (let i = 0; i < this.rows.length; i++) {
          for (let attr in this.rows[i]) {
            if (this.rows[i].hasOwnProperty(attr)) {
              this.rows[i][attr] = this.rowValue(this.rows[i], attr);
            }
          }
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
    this.router.navigate(new Array('/').concat(this.conf.route_add));
  }

  doEdit(id) {
    this.router.navigate(
      new Array('/').concat(this.conf.route_edit).concat(id));
  }

  doDelete(id) {
    this.dialog.confirm("Delete", "Are you sure you want to delete it?").subscribe((res) => {
      if (res) {
        this.loader.open();
        this.loaderOpen = true;
        let data = {};
        if (this.conf.wsDelete) {
          this.busy = this.ws.call(this.conf.wsDelete, [id]).subscribe(
            (res) => { this.getData() },
            (res) => { new EntityUtils().handleError(this, res);
              this.loader.close(); }
          );
        } else {
          this.busy = this.rest.delete(this.conf.resource_name + '/' + id, data).subscribe(
            (res) => {
              this.getData();
            },
            (res) => { new EntityUtils().handleError(this, res);
              this.loader.close(); }
          );
        }
      }
    })
  }
}
