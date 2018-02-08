import { Component, AfterViewInit, Input, ViewChild } from '@angular/core';
import { CoreServiceInjector } from 'app/core/services/coreserviceinjector';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { ThemeService } from 'app/services/theme/theme.service';
import { MaterialModule } from 'app/appMaterial.module';
import { ChartData } from 'app/core/components/viewchart/viewchart.component';
import { ViewChartDonutComponent } from 'app/core/components/viewchartdonut/viewchartdonut.component';
import { ViewChartPieComponent } from 'app/core/components/viewchartpie/viewchartpie.component';
import { ViewChartLineComponent } from 'app/core/components/viewchartline/viewchartline.component';
import { AnimationDirective } from 'app/core/directives/animation.directive';
import filesize from 'filesize';

@Component({
  selector: 'widget',
  templateUrl:'./widget.component.html'
})
export class WidgetComponent implements AfterViewInit {

  protected core:CoreService;
  protected themeService: ThemeService;
  @Input() widgetSize: string;
  public title:string = "Widget Base Class";
  public chartSize:number;
  public configurable: boolean = true;
  public flipAnimation = "stop";
  public flipDirection = "vertical";
  public isFlipped: boolean = false;

  constructor(){
    this.core = CoreServiceInjector.get(CoreService);
    this.themeService = CoreServiceInjector.get(ThemeService);
  }

  ngAfterViewInit(){
  }

  toggleConfig(){
    if(this.isFlipped){
      this.flipAnimation = "unflip";
    } else {
      this.flipAnimation = "flip"
    }

    if(this.flipDirection == "vertical"){
      this.flipAnimation += "V";
    } else if(this.flipDirection == "horizontal"){
      this.flipAnimation += "H";
    }

    this.isFlipped = !this.isFlipped;
  }

}
