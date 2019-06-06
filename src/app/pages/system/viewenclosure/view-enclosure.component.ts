import { ApplicationRef, Component, Injector, AfterContentInit, OnChanges, SimpleChanges, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { RestService, WebSocketService } from 'app/services/';
import { MaterialModule } from 'app/appMaterial.module';
import { EnclosureDisksComponent} from './enclosure-disks/enclosure-disks.component';

import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { Subject } from 'rxjs';
import { SystemProfiler } from './enclosure-disks/system-profiler';

interface ViewConfig {
  name: string;
  alias: string; // Used for tab label
  icon: string;
  id: number;
  elementIndex?: number;
  showInNavbar: boolean;
}

@Component({
  selector : 'view-enclosure',
  templateUrl :'./view-enclosure.component.html',
  styleUrls:['./view-enclosure.component.css']
})
export class ViewEnclosureComponent implements AfterContentInit, OnChanges, OnDestroy {

  public events:Subject<CoreEvent> ;
  @ViewChild('navigation', { static: false}) nav: ElementRef

  //public currentView: ViewConfig
  public currentView: ViewConfig =  { 
      name: 'Disks',
      alias: 'Disks',
      icon: "harddisk",
      id: 0,
      showInNavbar: true
  }
    
  public system: SystemProfiler;
  public system_product;
  public selectedEnclosure: any;
  public views: ViewConfig[] = [];

  changeView(id){
    this.currentView = this.views[id];
  }

  constructor(private core: CoreService, protected router: Router){

    /*if (window.localStorage.getItem('is_freenas') === 'true') {
      this.router.navigate(['']);
    }*/

    this.events = new Subject<CoreEvent>();
    this.events.subscribe((evt:CoreEvent) => {
      switch(evt.name){
        case "VisualizerReady":
          this.extractVisualizations();
          break;
        case "EnclosureCanvas":
          let el = this.nav.nativeElement.querySelector(".enclosure-" + evt.data.profile.enclosureKey);
          evt.data.canvas.setAttribute('style', 'width: 80% ;');
          el.appendChild(evt.data.canvas);
          break;
      }
    })

    core.register({observerClass: this, eventName: 'EnclosureData'}).subscribe((evt:CoreEvent) => {
      this.system = new SystemProfiler(this.system_product, evt.data);
      this.selectedEnclosure = this.system.profile[this.system.headIndex];
      core.emit({name: 'DisksRequest', sender: this});
    });

    core.register({observerClass: this, eventName: 'PoolData'}).subscribe((evt:CoreEvent) => {
      this.system.pools = evt.data;
      this.addViews();
    });


    core.register({observerClass: this, eventName: 'DisksData'}).subscribe((evt:CoreEvent) => {
      this.system.diskData = evt.data;
      core.emit({name: 'PoolDataRequest', sender: this});
    });

    core.register({observerClass: this, eventName: 'SysInfo'}).subscribe((evt:CoreEvent) => {
      this.system_product = 'M50'; // Just for testing on my FreeNAS box
      core.emit({name: 'EnclosureDataRequest', sender: this});
    });

    core.emit({name: 'SysInfoRequest', sender: this});
  }

  ngAfterContentInit(){
  }

  ngOnChanges(changes:SimpleChanges){
  }

  ngOnDestroy(){
    this.core.unregister({observerClass:this})
  }

  selectEnclosure(value){
    this.selectedEnclosure = this.system.profile[value];
    this.addViews();
  }

  extractVisualizations(){
    this.system.profile.forEach((item, index) => {
      this.events.next({name:"CanvasExtract", data: this.system.profile[index], sender:this});
    })
  }

  addViews(){
    let views = [];
    let disks =  { 
        name: 'Disks',
        alias: 'Disks',
        icon: "harddisk",
        id: 0,
        showInNavbar: true
    }
    
    views.unshift(disks);
    let matchIndex; 

    this.system.enclosures[this.selectedEnclosure.enclosureKey].elements.forEach((element, index) => {
      let view = { 
        name: element.name,
        alias: '',
        icon: "",
        id: views.length,
        elementIndex: index,
        showInNavbar: true
      }

      switch(element.name){
        case "Cooling" :
          view.alias = element.name;
          view.icon = "fan";
          views.push(view);
        break;
        case "Temperature Sensor" :
          view.alias = "Temperature";
          view.icon = "fan";
          views.push(view);
        break;
        case "Voltage Sensor" :
          view.alias = "Voltage";
          view.icon = "flash";
          views.push(view);
        break;
        case "Power Supply" :
          view.alias = element.name;
          view.icon = "flash";
          views.push(view);
        break;
        case "SAS Connector" :
          view.alias = "SAS";
          view.icon = "flash";
          views.push(view);
        break;
        case "Enclosure Services Controller Electronics":
          view.alias = "Services";
          view.icon = "flash";
          views.push(view);
        break;
      }

      if(view.alias == this.currentView.alias){ matchIndex = view.id;}
    });

    this.views = views;

    if(matchIndex && matchIndex > 0){
      this.currentView = views[matchIndex];
    } else {
      this.currentView = disks;
    }
  }

}
