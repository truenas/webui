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
  name?: string;
  children?: Node[];
};


@Component({
  selector: 'entity-group-table',
  templateUrl: './entity-group-table.component.html',
  styleUrls: ['./entity-group-table.component.scss'],
  providers: [DialogService]
})
export class EntityGroupTableComponent extends EntityTableComponent {
  
  nodes: Node[] = [];

  constructor(protected rest: RestService, protected router: Router, protected ws: WebSocketService,
    protected _eRef: ElementRef, protected dialog: DialogService, protected loader: AppLoaderService) { 
    super(rest, router, ws, _eRef, dialog, loader);
   }


   ngOnInit(): void {
    super.ngOnInit(); 
   }

   handleData(res) {
      super.handleData(res);
      
      let parentMap = new Map<string, Node>();

      this.rows.forEach((row)=>{
        const newNode = {
          id: row.id,
          name: row.path
        };

       if( row.path.indexOf("/") === -1 ) {
          
          this.nodes.push(newNode);
          parentMap.set(row.path, newNode);
        } else {
          const key: string = row.path.split('/')[0];
          const node: Node = parentMap.get(key);

          if(node) {
            if(typeof(node.children) === "undefined" ) {
              node.children = [];
            }

            newNode.name = newNode.name.substr( (key + "/").length );
            node.children.push(newNode);
          }
        }

        console.log("nodes:", this.nodes);
      });
   }
  
}
