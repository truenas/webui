import { Component, AfterViewInit, Input, ViewChild, OnChanges,SimpleChanges, OnDestroy } from '@angular/core';
import { CoreServiceInjector } from 'app/core/services/coreserviceinjector';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { Router } from '@angular/router';
import { MaterialModule } from 'app/appMaterial.module';
import { NgForm } from '@angular/forms';
import { ChartData } from 'app/core/components/viewchart/viewchart.component';
import { ViewChartDonutComponent } from 'app/core/components/viewchartdonut/viewchartdonut.component';
import { StorageService } from '../../../../services/storage.service'

import { WidgetComponent } from 'app/core/components/widgets/widget/widget.component';
import filesize from 'filesize';

import { TranslateService } from '@ngx-translate/core';

import { T } from '../../../../translate-marker';


@Component({
  selector: 'widget-pool',
  templateUrl:'./widgetpool.component.html',
  styleUrls: ['./widgetpool.component.css'],
})
export class WidgetPoolComponent extends WidgetComponent implements AfterViewInit, OnChanges, OnDestroy {

  @Input() poolData;
  constructor(public router: Router, public translate: TranslateService, public storage: StorageService){
    super(translate);
  }

  ngOnChanges(changes:SimpleChanges){
    if(changes.poolData){
      console.log(changes.poolData);
    }
  }

  ngAfterViewInit(){}

  ngOnDestroy(){
    this.core.unregister({observerClass:this})
  }


}
