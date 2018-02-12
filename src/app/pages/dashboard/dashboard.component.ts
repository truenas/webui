import { Component, AfterViewInit, ViewChild } from '@angular/core';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { Subject } from 'rxjs/Subject';
import { WidgetComponent } from 'app/core/components/widgets/widget/widget.component'; // POC
import { AnimationDirective } from 'app/core/directives/animation.directive';

@Component({
  selector: 'dashboard',
  template:`
  <div class="widgets-wrapper"
  fxLayout="row"
  fxLayoutWrap
  fxLayoutAlign="space-around center"
  fxLayoutGap="1%"
  style="margin-top:180px;">
  
    <widget-sysinfo fxFlex="48" [widgetSize]="medium" animate [animation]="animation" [shake]="shake"></widget-sysinfo>
    <widget-cpu-history fxFlex="48" [widgetSize]="medium" animate [animation]="animation" [shake]="shake"></widget-cpu-history>
    <widget-storage-collection fxFlex="98" [widgetSize]="medium" [widgetFlex]="zPoolFlex" [collectionLayout]="'row'"></widget-storage-collection>
  
    <button mat-fab color="primary" (click)="toggleShake()" style="position:fixed; z-index:30;bottom:24px; right:24px;"><mat-icon role="img">settings</mat-icon></button>
  </div>
      `
})
export class DashboardComponent implements AfterViewInit {

  protected core:CoreService;
  public large: string = "lg";
  public medium: string = "md";
  public small: string = "sm";
  public zPoolFlex:string = "48";

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
