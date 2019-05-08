import { Component, OnInit, AfterViewInit,OnDestroy, Input, ViewChild, Renderer2, ElementRef } from '@angular/core';
import { CoreServiceInjector } from 'app/core/services/coreserviceinjector';
import { Router } from '@angular/router';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { MaterialModule } from 'app/appMaterial.module';

import filesize from 'filesize';
import { WidgetComponent } from 'app/core/components/widgets/widget/widget.component';
import { environment } from 'app/../environments/environment';

import { TranslateService } from '@ngx-translate/core';

import { T } from '../../../../translate-marker';

interface NetIfInfo {
  name:string;
  primary:string;
  aliases?: string;
}


@Component({
  selector: 'widget-netinfo',
  templateUrl:'./widgetnetinfo.component.html',
  styleUrls: ['./widgetnetinfo.component.css']
})
export class WidgetNetInfoComponent extends WidgetComponent implements OnInit, AfterViewInit,OnDestroy {


  public memory:string;
  public imagePath:string = "assets/images/";
  public cardBg:string = "";
  public updateAvailable:boolean = false;
  private _updateBtnStatus:string = "default";
  public updateBtnLabel:string = T("Check for Updates")
  private _themeAccentColors: string[];
  public connectionIp:string = 'unknown' //= environment.remote
  public manufacturer:string = '';
  public buildDate:string;
  public loader:boolean = false;

  public title: string = "Network Info";
  public subtitle:string = "Primary NIC"
  public data: any;
  public nics: any[] = [];
  public nameServers: string;
  public defaultRoutes: string;
  public primaryIp:string = '';
  public rx:string = '';
  public tx:string = '';
  public primaryNicInfo:NetIfInfo;
  private _primaryNIC:string = '';
  get primaryNIC(){
    return this._primaryNIC;
  }
  set primaryNIC(val){
    this._primaryNIC = val;
    this.registerObservers(val);
  }

  constructor(public router: Router, public translate: TranslateService){
    super(translate);
    this.configurable = false;
    setTimeout(() => {
      if(!this.rx){
        this.loader = true;
      }
    }, 3000);
  }

  ngOnDestroy(){
    this.core.emit({name:"StatsRemoveListener", data:{name:"NIC", obj:this}});
    this.core.unregister({observerClass:this});
  }

  ngOnInit(){

    //Get Network info and determine Primary interface
    this.core.register({observerClass:this,eventName:"NetInfo"}).subscribe((evt:CoreEvent) => {
      
      this.defaultRoutes = evt.data.default_routes.toString();
      this.nameServers = evt.data.nameservers.toString().replace(/,/g, " , ");
      this.data = evt.data;
      let netInfo:any = evt.data.ips;
      let ipv4: string[] = [];
      for(let nic in netInfo){
        let ipv4 = netInfo[nic]["IPV4"];
        let ips = this.trimRanges(ipv4);
        let nicInfo:any = {
          name: nic,
          primary:"",//ips.primary,
          aliases: ips.aliases.toString()
        }
        this.nics.push(nicInfo);

        // Match the UI connection address
        let primary = ipv4.find((x) => {
          let addr = x.split("/");
          let result =  addr[0] == this.connectionIp;
          if(result){
            nicInfo.primary = addr[0];
          }
          return result
        });
        if(primary){
          this.primaryNicInfo = nicInfo;
          this.primaryNIC = nic;
        }
        // If we have the Primary NIC, register as a listener for the stat.
        if(this.primaryNIC){
          this.core.emit({name:"StatsAddListener", data:{name:"NIC", obj:this, key:this.primaryNIC} });
        }
      }

    });

    this.core.register({observerClass:this, eventName:"PrimaryNicInfo"}).subscribe((evt:CoreEvent) => {
      if(!evt.data){ 
        console.warn("PrimaryNicInfo event sent without data attached.");
        console.warn(evt);
        return;
      }
      let aliases = evt.data.aliases ? evt.data.aliases : "No aliases set";
      for(let i = 0; i < aliases.length; i++){
        if(aliases[i].type == "INET"){
          this.connectionIp = aliases[i].address;
        }
      }
      
      this.core.emit({name:"NetInfoRequest"});
    });

    this.core.emit({name:"PrimaryNicInfoRequest"});

  }

  ngAfterViewInit(){
  }

  registerObservers(nic){
      let Nic = nic.charAt(0).toUpperCase() + nic.slice(1); // Capitalize first letter
      this.core.register({observerClass:this,eventName:"StatsNIC" + Nic}).subscribe((evt:CoreEvent) => {
        this.data = evt.data.data;
        this.collectData(evt);
      });
  }

  trimRanges(a:string[]){
    if(a.length == 0){
      alert(a.length);
    }
    let trimmed:string[] = [];
    for(let i = 0; i < a.length; i++){
      let spl = a[i].split("/");
      let ip = spl[0];
      trimmed.push(ip);
    }
    let primaryIndex = this.findPrimary(trimmed);
    let primary = trimmed[primaryIndex];
    trimmed.splice(primaryIndex, 1);
    return {primary:primary, aliases:trimmed};
  }

  getSubnet(ip:string):string{
    let raw = ip.split(".");
    let subnet = raw[0] + '.' + raw[1] + '.' + raw[2];
    return subnet;
  }

  findPrimary(aliases:string[]){
    let result:number;
    for(let i = 0; i < aliases.length; i++){
      let test = this.isPrimary(aliases[i]);
      if(test){
        result = i;
        return result;
      }
    }
    if(!result){
      return -1;
    }
  }

  isPrimary(ip:string):boolean{
    let def = this.getSubnet(this.data.default_routes[0]);
    let subnet = this.getSubnet(ip);
    if(subnet == def){
      return true;
    } else {
      return false;
    }
  }

  collectData(evt:CoreEvent){
    let data = [];
    let rxIndex:number;
    let txIndex:number;
    if (evt.data && evt.data.data && evt.data.meta) {
      data = evt.data.data
      for(let l = 0; l < evt.data.meta.legend.length; l++){
        let x = evt.data.meta.legend[l];
        let key = "interface-" + this.primaryNIC + "/if_octets"
        if(x == key && !rxIndex){
          rxIndex = l;
          txIndex = l + 1;
          break;
        } 
      }
    }

    let rx:number[] = [];
    let tx:number[] = [];

    // Get the most current values (ignore undefined)
    for(let i = data.length - 1; i >= 0; i--){
      let value:number[] = data[i];
      // Skip if there is no value
      if(!value || typeof value == "undefined"){continue;}
      //End loop if both values have been assigned
      if(rx.length > 0 && tx.length > 0){
        this.loader = false;
        break;
      }

      // RX
      if(value && rx.length == 0 && value[rxIndex] && value[txIndex]){
        rx.push(value[rxIndex]);
        tx.push(value[txIndex]);
        continue;
      } else if(!value[rxIndex]){
        rx = [];
      } 
    }

    this.rx = this.getMbps(rx).toString();
    this.tx = this.getMbps(tx).toString();
  }

  getMbps(arr:number[]){
    // NOTE: Stat is in bytes so we convert
    // no average
    let result = arr[0]/1024/1024;
    if(result > 999){
      return result.toFixed(1)
    } else if(result < 1000 && result > 99){
      return result.toFixed(2);
    } else if(result > 9 && result < 100){
      return result.toFixed(3);
    } else if(result < 10){
      return result.toFixed(4);
    } else {
      return -1;
    }
    
  }

}
