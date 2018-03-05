import { Component, OnInit, AfterViewInit, Input, ViewChild, Renderer2, ElementRef } from '@angular/core';
import { CoreServiceInjector } from 'app/core/services/coreserviceinjector';
import { Router } from '@angular/router';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { MaterialModule } from 'app/appMaterial.module';
import { AnimationDirective } from 'app/core/directives/animation.directive';
import filesize from 'filesize';
import { WidgetComponent } from 'app/core/components/widgets/widget/widget.component';

@Component({
  selector: 'widget-netinfo',
  templateUrl:'./widgetnetinfo.component.html',
  styleUrls: ['./widgetnetinfo.component.css']
})
export class WidgetNetInfoComponent extends WidgetComponent implements OnInit, AfterViewInit {
  public title: string = "Network Info";
  public data: any;
  public nics: any[] = [];
  public nameServers: string;
  public defaultRoutes: string;
  public primaryIp:string = '';

  constructor(public router: Router){
    super();
    this.configurable = false;
  }

  ngOnInit(){
    this.core.register({observerClass:this,eventName:"NetInfo"}).subscribe((evt:CoreEvent) => {
      this.defaultRoutes = evt.data.default_routes.toString();
      this.nameServers = evt.data.nameservers.toString();
      console.warn(evt);
      this.data = evt.data;
      let netInfo:any = evt.data.ips;
      let ipv4: string[] = [];
      for(let nic in netInfo){
        console.log(nic);

        let ipv4 = netInfo[nic]["IPV4"];
        let ips = this.trimRanges(ipv4);
        let nicInfo:any = {
          name: nic,
          primary:ips.primary,
          aliases: ips.aliases.toString()
        }
        //this.primaryIp = this.findPrimary(ipv4);
        this.nics.push(nicInfo);
      }

    });
    this.core.emit({name:"NetInfoRequest"});
  }

  ngAfterViewInit(){
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
    console.warn(ip);
    let subnet = this.getSubnet(ip);
    if(subnet == def){
      return true;
    } else {
      return false;
    }
  }

}
