import { Component, AfterViewInit, Input, ViewChild, OnChanges, SimpleChanges, OnDestroy, Output, EventEmitter} from '@angular/core';
import { CoreServiceInjector } from 'app/core/services/coreserviceinjector';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { MaterialModule } from 'app/appMaterial.module';
import { NgForm } from '@angular/forms';
import { ChartData } from 'app/core/components/viewchart/viewchart.component';
import { Subject } from 'rxjs';
import { FlexLayoutModule, MediaObserver } from '@angular/flex-layout';

import { Router } from '@angular/router';
import { UUID } from 'angular2-uuid';
import * as d3 from 'd3';
import * as c3 from 'c3';

import filesize from 'filesize';
import { WidgetComponent } from 'app/core/components/widgets/widget/widget.component';

import { ViewChartGaugeComponent } from 'app/core/components/viewchartgauge/viewchartgauge.component';
import { ViewChartBarComponent } from 'app/core/components/viewchartbar/viewchartbar.component';
import { TranslateService } from '@ngx-translate/core';

import { T } from '../../../../translate-marker';

export interface DashConfigItem {
  name: string; // Shown in UI fields
  identifier?: string; // Comma separated 'key,value' eg. pool might have 'name,tank'
  rendered: boolean;
  position?: number;
}

@Component({
  selector: 'widget-controller',
  templateUrl: './widgetcontroller.component.html',
  styleUrls: ['./widgetcontroller.component.css']
})
export class WidgetControllerComponent extends WidgetComponent implements AfterViewInit {

  @Input() dashState: DashConfigItem[] = [];
  @Input()renderedWidgets?: number[] = [];
  @Input()hiddenWidgets?: number[] = [];

  @Output() launcher = new EventEmitter()

  public title:string = T("Dashboard");
  public subtitle:string = T("Navigation");
  public widgetColorCssVar = "var(--accent)";
  public configurable = false;
  public screenType: string = 'Desktop'; // Desktop || Mobile


  constructor(public router: Router, public translate: TranslateService, public mediaObserver: MediaObserver){
    super(translate);

    mediaObserver.media$.subscribe((evt) =>{
      let st = evt.mqAlias == 'xs' ? 'Mobile' : 'Desktop';
      this.screenType = st;
    });
  }

  ngOnChanges(changes:SimpleChanges){
    if(changes.renderedWidgets){
      console.log(changes.renderedWidgets);
    } else if(changes.hiddenWidgets){
      console.log(changes.hiddenWidgets);
    } 
  }

  ngOnDestroy(){
    this.core.unregister({observerClass:this});
  }

  ngAfterViewInit(){

    this.core.register({observerClass: this, eventName:"ThemeChanged"}).subscribe((evt: CoreEvent) => {
    });


  }

  nameFromIdentifier(identifier){
    const spl = identifier.split(',');
    const key = spl[0];
    const value = spl[1];

    if(key == 'name'){
      return value;
    } else { 
      return '';
    }

  }

  launchWidget(widget){
    //console.log(widget);
    this.launcher.emit(widget);
  }


}
