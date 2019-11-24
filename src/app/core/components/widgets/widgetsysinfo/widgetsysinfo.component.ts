import { Component, OnInit, OnDestroy, AfterViewInit, Input, ViewChild, Renderer2, ElementRef } from '@angular/core';
import { CoreServiceInjector } from 'app/core/services/coreserviceinjector';
import { Router } from '@angular/router';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { MaterialModule } from 'app/appMaterial.module';
import { ChartData } from 'app/core/components/viewchart/viewchart.component';
import { ViewChartDonutComponent } from 'app/core/components/viewchartdonut/viewchartdonut.component';
import { ViewChartPieComponent } from 'app/core/components/viewchartpie/viewchartpie.component';
import { ViewChartLineComponent } from 'app/core/components/viewchartline/viewchartline.component';
import { WebSocketService, SystemGeneralService } from '../../../../services/';
import { FlexLayoutModule, MediaObserver } from '@angular/flex-layout';


import filesize from 'filesize';
import { WidgetComponent } from 'app/core/components/widgets/widget/widget.component';
import { environment } from 'app/../environments/environment';

import { TranslateService } from '@ngx-translate/core';

import { T } from '../../../../translate-marker';

@Component({
  selector: 'widget-sysinfo',
  templateUrl:'./widgetsysinfo.component.html',
  styleUrls: ['./widgetsysinfo.component.css']
})
export class WidgetSysInfoComponent extends WidgetComponent implements OnInit,OnDestroy, AfterViewInit {

  // HA
  @Input('isHA') isHA: boolean = false
  @Input('passive') isPassive: boolean = false

  public title: string = T("System Info");
  public data: any;
  public memory:string;
  public imagePath:string = "assets/images/";
  public ready:boolean = false;
  public product_image = '';
  public product_model = '';
  public certified = false;
  public failoverBtnLabel: string = "FAILOVER TO STANDBY"
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
  public isFN: boolean = false;
  public isUpdateRunning = false;
  public is_ha: boolean;
  public updateMethod = 'update.update';
  public screenType: string = 'Desktop';

  constructor(public router: Router, public translate: TranslateService, private ws: WebSocketService,
    public sysGenService: SystemGeneralService,  public mediaObserver: MediaObserver){
    super(translate);
    this.configurable = false;
    this.sysGenService.updateRunning.subscribe((res) => { 
      res === 'true' ? this.isUpdateRunning = true : this.isUpdateRunning = false;
    });

    mediaObserver.media$.subscribe((evt) =>{
      let st = evt.mqAlias == 'xs' ? 'Mobile' : 'Desktop';
      this.screenType = st;
    });
  }


  log(str){ console.log(str); }

  ngAfterViewInit(){

    this.core.register({observerClass:this,eventName:"UpdateChecked"}).subscribe((evt:CoreEvent) => {
      //DEBUG: console.log(evt);
      if(evt.data.status == "AVAILABLE"){
        this.updateAvailable = true;
      }
    });

    if(this.isHA && this.isPassive){
      // Delay query
      setTimeout(() => {
        this.ws.call('failover.call_remote', ['system.info']).subscribe((res) => {
          const evt = {name: 'SysInfoPassive', data:res};
          this.processSysInfo(evt);
        });
      }, 500);
    } else {

      this.ws.call('system.info').subscribe((res) => {
        const evt = {name: 'SysInfo', data:res};
        this.processSysInfo(evt);
      });
      
      this.core.emit({name:"UpdateCheck"});
      
    }
    if (window.localStorage.getItem('is_freenas') === 'false') {
      this.ws.call('failover.licensed').subscribe((res) => {
        if (res) {
          this.updateMethod = 'failover.upgrade';
          this.is_ha = true;
        };
        this.checkForRunningUpdate();
      });
    }
  }

  ngOnInit(){
  }

  checkForRunningUpdate() {
    this.ws.call('core.get_jobs', [[["method", "=", this.updateMethod], ["state", "=", "RUNNING"]]]).subscribe(
      (res) => {
        if (res && res.length > 0) {
          this.isUpdateRunning = true;
        }
      },
      (err) => {
        console.error(err);
      });
  }
 
  ngOnDestroy(){
    this.core.unregister({observerClass:this});
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

  processSysInfo(evt:CoreEvent){
      
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
        this.getFreeNASImage(evt.data.system_product);
        this.isFN = true;
      } else {
        this.systemLogo = 'TrueNAS_Logomark_Black.svg';
        this.getTrueNASImage(evt.data.license.model);
        this.isFN = false;
        console.warn(this.product_model);
      }    

      this.ready = true;

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

  getTrueNASImage(sys_product) {
    if (sys_product.includes('X10')) {
      this.product_image = '/servers/X10.png';
      this.product_model = 'X10';
    } else if (sys_product.includes('X20')) {
      this.product_image = '/servers/X20.png';
      this.product_model = 'X20';
    } else if (sys_product.includes('M40')) {
      this.product_image = '/servers/M40.png';
      this.product_model = 'M40';
    }  else if (sys_product.includes('M50')) {
      this.product_image = '/servers/M50.png';
      this.product_model = 'M50';
    } else if (sys_product.includes('Z20')) {
      this.product_image = '/servers/Z20.png';
      this.product_model = 'Z20';
    } else if (sys_product.includes('M50')) {
      this.product_image = '/servers/M50.png';
      this.product_model = 'M50';
    } else if (sys_product.includes('Z35')) {
      this.product_image = '/servers/Z35.png';
      this.product_model = 'Z35';
    } else if (sys_product.includes('Z50')) {
      this.product_image = '/servers/Z50.png';
      this.product_model = 'Z50';
    }
    else {
      this.product_image = 'ix-original.svg';
    }
  }

  getFreeNASImage(sys_product) {

    if (sys_product && sys_product.includes('CERTIFIED')) {
      this.product_image = '';
      this.certified = true;
      return;
    }
    
    switch(sys_product){
      case "FREENAS-MINI-2.0":
      case "FREENAS-MINI-3.0-E":
        this.product_image = 'freenas_mini_cropped.png';
      break;
      case "FREENAS-MINI-XL":
      case "FREENAS-MINI-3.0-XL+":
        this.product_image = 'freenas_mini_xl_cropped.png';
      break;
      default:
        this.product_image = '';
      break;
    }
  }


}
