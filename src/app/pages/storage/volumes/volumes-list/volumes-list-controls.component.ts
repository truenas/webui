import { Component, ElementRef, Input, ViewChild, OnInit, AfterViewInit, OnDestroy,} from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

import { RestService } from '../../../../services/rest.service';
import { GlobalAction } from 'app/components/common/pagetitle/pagetitle.component';
//import { VolumesListComponent } from './volumes-list.component';

@Component({
  selector : 'app-volumes-list-controls',
  templateUrl: './volumes-list-controls.component.html'
})
export class VolumesListControlsComponent implements GlobalAction, OnInit, AfterViewInit, OnDestroy {
  @ViewChild('filter', { static: false}) filter: ElementRef;
  @Input('entity') entity: any; // Can't specify VolumesListComponent without creating circular dependency;
  public conf;

  public actions: any[];
  public menuTriggerMessage:string = "Click for options";

  public spin: boolean = true;
  public direction: string = 'left';
  public animationMode: string = 'fling';
  get totalActions(){
    let addAction = this.entity.conf.route_add ? 1 : 0;
    return this.actions.length + addAction;
  }

  constructor(protected translate: TranslateService, public router:Router) { }

  ngOnInit() { 
  }

  ngOnDestroy(){
  }

  ngAfterViewInit(){
    if (this.filter) {
      this.entity.filter = this.filter;
    }
  }

  applyConfig(config: any){
    if(config ){
      this.actions = config.getAddActions(); 
      this.conf = config.conf;
      this.entity = config;
    } else {
      throw "This component requires an entity class for a config"
    }
  }

  navigate(path: string){
    this.router.navigate(path.split('/'));
  }

}
