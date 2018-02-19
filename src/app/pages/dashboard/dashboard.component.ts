import { Component, AfterViewInit, ViewChild } from '@angular/core';
import { CoreService, CoreEvent } from 'app/core/services/core.service';

import { Subject } from 'rxjs/Subject';
import { WidgetComponent } from 'app/core/components/widgets/widget/widget.component'; // POC
import { AnimationDirective } from 'app/core/directives/animation.directive';

import {RestService,WebSocketService} from '../../services/';

@Component({
  selector: 'dashboard',
  templateUrl:'./dashboard.html'
})
export class DashboardComponent implements AfterViewInit {

  protected core:CoreService;
  public large: string = "lg";
  public medium: string = "md";
  public small: string = "sm";
  public zPoolFlex:string = "100";
  public noteFlex:string = "23";

  public animation = "stop";
  public shake = false;

  constructor(){
  }

  ngAfterViewInit(){
    this.init();
  }

  init(){

    console.log("******** Dashboard Initializing... ********");
  }

  toggleShake(){
    if(this.shake){
      this.shake = false;
    } else if(!this.shake){
      this.shake= true;
    }
  }

  updateData(data){
    // Do Something
    }

  updateDataAll(data){
  }
}
