import { Component, OnInit, OnDestroy, AfterViewInit, Input, ViewChild, Renderer2, ElementRef } from '@angular/core';
import { CoreServiceInjector } from 'app/core/services/coreserviceinjector';
import { Router } from '@angular/router';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { MaterialModule } from 'app/appMaterial.module';
import { ChartData } from 'app/core/components/viewchart/viewchart.component';
import { ViewChartDonutComponent } from 'app/core/components/viewchartdonut/viewchartdonut.component';
import { ViewChartPieComponent } from 'app/core/components/viewchartpie/viewchartpie.component';
import { ViewChartLineComponent } from 'app/core/components/viewchartline/viewchartline.component';

import filesize from 'filesize';
import { WidgetComponent } from 'app/core/components/widgets/widget/widget.component';
import { environment } from 'app/../environments/environment';

import { TranslateService } from '@ngx-translate/core';

import { T } from '../../../../translate-marker';

@Component({
  selector: 'widget-sysinfo',
  templateUrl:'./widgetsysinfo.component.html',
  styleUrls: ['./widgetsysinfo.component.scss']
})
export class WidgetSysInfoComponent extends WidgetComponent implements OnInit,OnDestroy, AfterViewInit {
  public title: string = T("System Info");
  public data: any;
  public memory:string;
  public imagePath:string = "assets/images/";
  public cardBg:string = "";
  public updateAvailable:boolean = false;
  private _updateBtnStatus:string = "default";
  public updateBtnLabel:string = T("Check for Updates")
  private _themeAccentColors: string[];
  public connectionIp = environment.remote
  public manufacturer:string = '';
  public buildDate:string;
  public loader:boolean = false;
  public is_freenas: string = window.localStorage['is_freenas'];
  public systemLogo: any;
  public isFN: boolean;

  constructor(public router: Router, public translate: TranslateService){
    super(translate);
    this.configurable = false;
  }

  ngAfterViewInit(){
    this.core.register({observerClass:this,eventName:"SysInfo"}).subscribe((evt:CoreEvent) => {
      //DEBUG: console.log("******** SysInfo ********");
      console.log(evt.data);
      this.loader = false;
      this.data = evt.data;

      let build = new Date(this.data.buildtime[0]['$date']);
      let year = build.getUTCFullYear();
      let months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec",]
      let month = months[build.getUTCMonth()];
      let day = build.getUTCDate();
      let hours = build.getUTCHours();
      let minutes = build.getUTCMinutes();
      this.buildDate = month + " " +  day + ", " + year + " " + hours + ":" + minutes;

      this.memory = this.formatMemory(this.data.physmem, "GiB");
      if(this.data.system_manufacturer && this.data.system_manufacturer.toLowerCase() == 'ixsystems'){
        this.manufacturer = "ixsystems";
      } else {
        this.manufacturer = "other";
      }
      if (this.is_freenas === 'true') {
        this.systemLogo = 'logo.svg';
        this.isFN = true;
      } else {
        this.systemLogo = 'TrueNAS_Logomark_Black.svg';
        this.isFN = false;
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
          this.cardBg = this.systemLogo;
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

  ngOnInit(){
  }

  ngOnDestroy(){
    this.core.unregister({observerClass:this});
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
      this._updateBtnStatus = "default";
      this.updateBtnLabel = T("Updates Available");
    }
    return this._updateBtnStatus;
  }

  formatMemory(physmem:number, units:string){
    let result:string;
    if(units == "MiB"){
      result = Number(physmem / 1024 / 1024).toFixed(0) + ' MiB';
    } else if(units == "GiB"){
      result = Number(physmem / 1024 / 1024 / 1024).toFixed(0) + ' GiB';
    }
    return result;
  }

}
