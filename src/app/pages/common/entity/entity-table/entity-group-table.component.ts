import { Component, OnInit, Input, ElementRef, ViewEncapsulation, ViewChild, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { DataSource } from '@angular/cdk';
import { MdPaginator, MdSort, PageEvent } from '@angular/material';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Subscription } from 'rxjs';
import 'rxjs/add/operator/startWith';
import 'rxjs/add/observable/merge';
import 'rxjs/add/operator/map';

//local libs
import { RestService } from '../../../../services/rest.service';
import { WebSocketService } from '../../../../services/ws.service';
import { EntityUtils } from '../utils';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { DialogService } from 'app/services';
import { EntityTableComponent } from 'app/pages/common/entity/entity-table';


export interface Node {
  id?: number;
  type?: string;
  name?: string;
  fullpath?: string;
  parent?: string;
  children?: Node[];
};


@Component({
  selector: 'entity-group-table',
  templateUrl: './entity-group-table.component.html',
  styleUrls: ['./entity-group-table.component.scss'],
  providers: [DialogService]
})
export class EntityGroupTableComponent extends EntityTableComponent {
  readonly parentId = -666;
  readonly parentRootPath = "/ROOT/";
  readonly parentName = "All";

  parent: Node = {
    id: this.parentId,
    name: this.parentName,
    fullpath: this.parentRootPath,
    type: this.parentRootPath,
    parent: null,
    children: []
  };

  parentMap: Map<string, Node> = new Map<string, Node>();


  constructor(protected rest: RestService, protected router: Router, protected ws: WebSocketService,
    protected _eRef: ElementRef, protected dialog: DialogService, protected loader: AppLoaderService) {
    super(rest, router, ws, _eRef, dialog, loader);
  }


  ngOnInit(): void {
    super.ngOnInit();
  }

  handleData(res): any {

    res = super.handleData(res);

    this.rows.forEach((row) => {
      const newNode: Node = {
        id: row.id,
        type: row.type,
        name: row.path,
        parent: this.parentRootPath,
        fullpath: row.path

      };
      this.parentMap.set(row.path, newNode);


      if (row.path.indexOf("/") === - 1) {

        if( newNode.type === "zpool" ) {
          newNode.name += "(zpool)";
        }
        this.parent.children.push(newNode);
      } else {
        let lastIndexOf: number = row.path.lastIndexOf("/");
        if (lastIndexOf === -1) {
          lastIndexOf = row.path.length;
        }

        const key: string = row.path.substr(0, lastIndexOf);

        if (this.parentMap.has(key)) {
          const parentNode: Node = this.parentMap.get(key);


          if (typeof (parentNode.children) === "undefined") {
            parentNode.children = [];
          }

          newNode.name = newNode.name.substr((key + "/").length);
          newNode.parent = key;
          parentNode.children.push(newNode);
        }
      }

    });

    return res;
  }


  treeOnActiveChanged($event) {
    const newData: any[] = [];

    this.rows.forEach((row) => {

      if( row.path === $event.node.data.fullpath || $event.node.data.fullpath === this.parentRootPath) {
        newData.push(row);
      } else {
        let lastIndexOf: number = row.path.lastIndexOf("/");
        if (lastIndexOf === -1) {
          lastIndexOf = row.path.length;
        }

        let key: string = row.path.substr(0, lastIndexOf);
        const filteredParentRootNode: Node = this.parentMap.get($event.node.data.fullpath);

        let found = false;
        while (this.parentMap.has(key) && key !== this.parentRootPath) {
          const node = this.parentMap.get(key);

          if (node.id === filteredParentRootNode.id) { 
            found = true;
            break;
          }

          key = node.parent;
        }

        if (found === true) {
          newData.push(row);
        }
      }

      


    });

    this.currentRows = newData;
    this.paginationPageIndex = 0;
    this.setPaginationInfo();
  }

}
