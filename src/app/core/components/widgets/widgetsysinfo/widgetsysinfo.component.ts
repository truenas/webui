import { Component, OnInit, AfterViewInit, Input, ViewChild, Renderer2, ElementRef } from '@angular/core';
import { CoreServiceInjector } from 'app/core/services/coreserviceinjector';
import { Router } from '@angular/router';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { MaterialModule } from 'app/appMaterial.module';
import { ChartData } from 'app/core/components/viewchart/viewchart.component';
import { ViewChartDonutComponent } from 'app/core/components/viewchartdonut/viewchartdonut.component';
import { ViewChartPieComponent } from 'app/core/components/viewchartpie/viewchartpie.component';
import { ViewChartLineComponent } from 'app/core/components/viewchartline/viewchartline.component';
import { AnimationDirective } from 'app/core/directives/animation.directive';
import filesize from 'filesize';
import { WidgetComponent } from 'app/core/components/widgets/widget/widget.component';
import { environment } from 'app/../environments/environment';

@Component({
  selector: 'widget-sysinfo',
  templateUrl:'./widgetsysinfo.component.html',
  styleUrls: ['./widgetsysinfo.component.css']
})
export class WidgetSysInfoComponent extends WidgetComponent implements OnInit, AfterViewInit {
  public title: string = "System Info";
  public data: any;
  public memory:string;
  public imagePath:string = "assets/images/";
  public cardBg:string = "";
  public updateAvailable:boolean = false;
  private _updateBtnStatus:string = "primary";
  public updateBtnLabel:string = "Check for Updates..."
  private _themeAccentColors: string[];
  public connectionIp = environment.remote
  public manufacturer:string = '';

  constructor(public router: Router){
    super();
    this.configurable = false;
  }

  ngOnInit(){
    this.core.register({observerClass:this,eventName:"SysInfo"}).subscribe((evt:CoreEvent) => {
      //DEBUG: console.log("******** SysInfo ********");
      //DEBUG: console.log(evt.data);
      this.data = evt.data;
      this.memory = this.formatMemory(this.data.physmem, "GB");
      if(this.data.system_manufacturer && this.data.system_manufacturer.toLowerCase() == 'ixsystems'){
        this.manufacturer = "ixsystems";
      } else {
        this.manufacturer = "other";
      }

      // Hardware detection
      switch(evt.data.system_product){
        case "FREENAS-MINI-2.0":
          this.cardBg = 'freenas_mini.png';
          //this.cardBg = 'logo.svg';
        break;
        case "FREENAS-MINI-XL":
          this.cardBg = 'freenas_mini_xl.png';
          //this.cardBg = 'logo.svg';
        break;
        default:
          this.cardBg = 'logo.svg';
        break;
      }
    });

    this.core.register({observerClass:this,eventName:"UpdateChecked"}).subscribe((evt:CoreEvent) => {
      //DEBUG: console.log(evt);
      if(evt.data.status == "AVAILABLE"){
        this.updateAvailable = true;
      }
    });
    this.core.emit({name:"SysInfoRequest"});
    this.core.emit({name:"UpdateCheck"});
  }
  
  ngAfterViewInit(){
    //console.log(this.el.nativeElement.children);
    setTimeout(()=>{
      this.core.emit({name:"AnimateColorLoopStart", data:{element:'#widget-sysinfo-logo-bg', colors:this.themeAccentColors}});
    }, 3000);
  }

  getCardBg(){
    return "url('" + this.imagePath + this.cardBg + "')";
  }

  get themeAccentColors(){
    let theme = this.themeService.currentTheme();
    this._themeAccentColors = [];
    for(let color in theme.accentColors){
      this._themeAccentColors.push(theme[theme.accentColors[color]]);
    }
    return this._themeAccentColors;
  }

  get updateBtnStatus(){
    if(this.updateAvailable){
      this._updateBtnStatus = "warn";
      this.updateBtnLabel = "Updates Available...";
    }
    return this._updateBtnStatus;
  }

  formatMemory(physmem:number, units:string){
    let result:string; 
    if(units == "MB"){
      result = Number(physmem / 1024 / 1024).toFixed(0) + ' MB';
    } else if(units == "GB"){
      result = Number(physmem / 1024 / 1024 / 1024).toFixed(0) + ' GB';
    }
    return result;
  }

}
