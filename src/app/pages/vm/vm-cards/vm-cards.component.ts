import { Component, OnInit, AfterViewInit, Input, ElementRef, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MaterialModule } from '../../../appMaterial.module';
import { MatButtonToggleGroup } from '@angular/material/button-toggle';
import { EntityModule } from '../../common/entity/entity.module';
import { WebSocketService, RestService } from '../../../services/';
import { DialogService } from '../../../services/dialog.service';
import { AppLoaderService } from '../../../services/app-loader/app-loader.service';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/observable/fromEvent';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { EntityUtils } from '../../../pages/common/entity/utils';


interface VmProfile {
  name?:string;
  id?:string;
  description?:string;
  info?:string;
  bootloader?:string;
  state?:string;
  autostart?:string;
  vcpus?:string;
  memory?:string;
  lazyLoaded?:boolean;
  vnc?:boolean;
  devices?:any,
  template?:string; // for back face of card
  cardActions?:Array<any>;
  isNew?:boolean;
}

@Component({
  selector: 'vm-cards',
  templateUrl: './vm-cards.component.html',
  styleUrls: ['./vm-cards.component.css'],
})
export class VmCardsComponent implements OnInit {

  @ViewChild('filter') filter: ElementRef;
  @Input() searchTerm:string = '';
  @Input() cards = []; // Display List
  @Input() cache = []; // Master List: 
  @ViewChild('viewMode') viewMode:MatButtonToggleGroup;
  focusedVM:string;

  public controlEvents:Subject<CoreEvent> = new Subject();
  public tpl = "edit";
  //private pwrBtnLabel: string;
  private pwrBtnOptions = {
    stopped: "Start VM",
    running: "Stop VM"
  }
  protected loaderOpen: boolean = false;

  constructor(protected ws: WebSocketService,protected rest: RestService,private core:CoreService, private dialog: DialogService,protected loader: AppLoaderService,protected router: Router){}

  ngOnInit() {
    this.viewMode.value = "cards";
    /*
     * Communication Downwards:
     * Listen for events from UI controls
     * */
    
    this.controlEvents.subscribe((evt:CoreEvent) => {
      let index = this.getCardIndex("id",evt.sender.machineId);
      switch(evt.name){
        case "FormSubmitted":
          //evt.data.autostart = evt.data.autostart.toString();
          if(evt.sender.isNew){
            //DEBUG: console.log("Card New");
            //DEBUG: console.log(evt);
            let index = this.getCardIndex('isNew',true);
            this.cards[index].name = evt.data.name;
            this.cards[index].state = "Loading...";
            this.core.emit({name:"VmCreate",data:[evt.data] ,sender:evt.sender.machineId});
          } else {
            //DEBUG: console.log("Card Edit");
            console.warn(evt);
            let formValue = this.parseResponse(evt.data,true);
            this.core.emit({name:"VmProfileUpdate",data:[evt.sender.machineId,formValue] ,sender:evt.sender.machineId});
            this.toggleForm(false,this.cards[index],'none');
            //this.refreshVM(index,evt.sender.machineId);
          }
        break;
        case "FormCancelled":
          console.warn(evt);
          console.warn(index);
          this.cancel(index);
        break;
      default:
        console.warn("Unknown Event:" + evt.name);
      break;
      }
    });

    /* 
     * Communication Upwards:
     * Register the component with the EventBus 
     * and subscribe to the observable it returns
     */
    this.core.register({observerClass:this,eventName:"VmProfiles"}).subscribe((evt:CoreEvent) => {
      //DEBUG: console.log("VmProfiles! *********");
      //DEBUG: console.log(evt);
      this.setVmList(evt,'init');
    });

    this.core.register({observerClass:this,eventName:"VmProfile"}).subscribe((evt:CoreEvent) => {
      //DEBUG: console.log("VmProfile! *********");
      //DEBUG: console.log(evt);
      this.setVm(evt);
    });

    this.core.register({observerClass:this,eventName:"VmStatus"}).subscribe((evt:CoreEvent) => {
      //DEBUG: console.log("VmStatus! *********");
      //DEBUG: console.log(evt.data.id);

      let cardIndex = this.getCardIndex('id',evt.data.id);
      this.cards[cardIndex].state = evt.data.state.toLowerCase();

      let cacheIndex = this.getCardIndex('id',evt.data.id,true);
      this.cache[cacheIndex].state = evt.data.state.toLowerCase();
    });

    this.core.register({observerClass:this,eventName:"VmStarted"}).subscribe((evt:CoreEvent) => {
      //DEBUG: console.log("VmStarted! *********");
      //DEBUG: console.log(evt);
      //let index = this.getCardIndex('id',evt.sender[0]);
      //this.refreshVM(index,evt.sender[0]); // Can't use this because API doesn't return vm.id

      let cardIndex = this.getCardIndex('id',evt.data.id);
      this.cards[cardIndex].state = 'running';

      let cacheIndex = this.getCardIndex('id',evt.data.id,true);
      this.cache[cacheIndex].state = 'running';
    });

    this.core.register({observerClass:this,eventName:"VmStopped"}).subscribe((evt:CoreEvent) => {
      //DEBUG: console.log("VmStopped! *********");
      //DEBUG: console.log(evt);
      //let index = this.getCardIndex('id',evt.sender[0]);
      //this.refreshVM(index,evt.sender[0]); // Workaround: sender returns the request params

      let cardIndex = this.getCardIndex('id',evt.data.id);
      this.cards[cardIndex].state = 'stopped';

      let cacheIndex = this.getCardIndex('id',evt.data.id,true);
      this.cache[cacheIndex].state = 'stopped';
    });

    this.core.register({observerClass:this,eventName:"VmCreated"}).subscribe((evt:CoreEvent) => {
      //DEBUG: console.log("VmCreated! *********");
      //DEBUG: console.log(evt);
      let index = this.getCardIndex('isNew', true);
      this.toggleForm(false,this.cards[index],'none');
      this.core.emit({name:"VmProfilesRequest"});
    });

    this.core.register({observerClass:this,eventName:"VmDeleted"}).subscribe((evt:CoreEvent) => {
      //DEBUG: console.log("VmDeleted! *********");
      //DEBUG: console.log(evt);
      this.removeVM(evt); // Workaround: sender returns the request params
    });

    this.getVmList();
  }

  getCardIndex(key:any,value:any,cache?:boolean){
    let target: any[];
    if(cache == true){
      target = this.cache;
    } else{
      target = this.cards;
    }
    for(let i = 0; i < target.length; i++){
      if(target[i][key] == value){
        return i;
      }
    }
  }

  displayAll(){
    for(var i = 0; i < this.cache.length; i++){
      this.cards[i] = Object.assign({}, this.cache[i]);
    }
  }

  displayFilter(key,query?){
    //DEBUG: console.log(key + '/' + query);
    if(query == '' || !query){
      this.displayAll();
    } else {
      this.cards = this.cache.filter((card) => {
        //DEBUG: console.log(card[key]);
        var result = card[key].toLowerCase().indexOf(query.toLowerCase()) > -1;
        //if(result !== -1){ 
        //DEBUG: console.log(result)
        return result;
        //}
        });
      //DEBUG: console.log("**** this.display ****");
      //DEBUG: console.log(this.cards);
    }
  }

  parseResponse(data:any, formatForUpdate?:boolean){
    //DEBUG: console.log("******** PARSING RESPONSE ********");
    //DEBUG: console.log(data);
    let card: VmProfile = { 
      name:data.name,
      description:data.description,
      info:data.info,
      bootloader:data.bootloader,
      autostart:data.autostart,
      vcpus:data.vcpus,
      memory:data.memory,
      devices:data.devices
    }   

    // Leave out properties not used for update requests
    if(formatForUpdate){
      return card;
    }
    card.id = data.id;
    card.state = "Loading...";
    card.vnc = false; // Until we verify otherwise we assume false
    card.lazyLoaded = false;
    card.template = 'none';
    card.isNew = false;
    //cardActions:[]
    if(card.devices.length > 0){
      //DEBUG: console.log(card.devices);
      card.vnc = this.checkVnc(card.devices);
      //DEBUG: console.log(card.vnc);
    }
    return card;
  }

  getVmList(){
    this.core.emit({name:"VmProfilesRequest"});
  }

  setVmList(res:CoreEvent, init?:string) { 
    this.cache = [];
    for(var i = 0; i < res.data.length; i++){
      let card = this.parseResponse(res.data[i]);
      //this.checkVnc(card);
      this.cache.push(card);
    }   
    if(init){
      this.displayAll();
    } else {
      this.updateCards();
    }
    this.checkStatus();
  }


  getVm(index,id?:any) {
    if(this.cards[index].isNew && id){
      //DEBUG: console.log(id);
      this.cards[index].isNew = false;
      this.cards[index].id = id;
    } 
    this.core.emit({
      name:"VmProfileRequest",
      data:[[["id", "=", String(this.cards[index].id)]]]
    });
  }

  setVm(evt:CoreEvent){
    let res = evt.data[0];
    //DEBUG: console.log(res.id);
    let currentIndex = this.getCardIndex("id",res.id);
    let cacheIndex = this.getCardIndex("id",res.id);

    if(!res.state){
      //DEBUG: console.log(currentIndex);
      let currentState = this.cards[currentIndex].state;
      //res.state = currentState;
    }
    let card = this.parseResponse(res);
    let index = currentIndex;
    

    // delay to allow flip animation
    setTimeout( () => {
      this.cards[currentIndex] = card;
      this.cache[cacheIndex] = card;
      this.checkStatus(res.id);
      //this.updateCache();
    },300);
  }

  updateCache(){
    this.cache = [];
    this.getVmList();
  }

  updateCards(isNew?:VmProfile){
    let result = [];
    for(let i = 0; i < this.cards.length; i++){
      for(let ii = 0; ii < this.cache.length; ii++){
        if(this.cache[ii].id == this.cards[i].id){
          let newCard = Object.assign({}, this.cache[ii]);
          result.push(newCard);
        }
      }
    }
    if(isNew){
      result.push(isNew) 
    }

    this.cards = result;
  }

  refreshVM(index,id:any){
    this.getVm(index,id);
  }


  addVM(){
    let index = this.cards.length;
    let card: VmProfile = { 
      name:"",
      description:"",
      info:"",
      bootloader:"",
      state:"stopped",
      autostart:"",
      vcpus:"",
      memory:"",
      lazyLoaded: false,
      template:'',
      isNew:true
    }
    //this.cards.push(card);
    this.updateCards(card);
    this.toggleForm(true,this.cards[index],'edit');
  }
  addVMWizard(){
    this.router.navigate(
      new Array('').concat([ "vm", "wizard" ])
    );

  }


  deleteVM(index) {
    this.dialog.confirm("Delete", "Are you sure you want to delete " + this.cards[index].name + "?").subscribe((res) => {
      if (res) {
        this.loader.open();
        this.loaderOpen = true;
        let data = {};
        this.core.emit({name:"VmDelete", data:[this.cards[index].id], sender:index});
      }
    })
  }

  removeVM(evt:CoreEvent){
    //DEBUG: console.log("removeVM ********");
    //DEBUG: console.log(evt);
    let index = this.getCardIndex("id", evt.sender);
    this.focusedVM = '';
    this.cards.splice(index,1);
    this.loader.close();
    this.updateCache();
  }

  cancel(index){
    let card = this.cards[index];
    if(card.isNew){
      this.cards.splice(index,1);
      this.updateCache();
    } else {
      this.toggleForm(false,card,'none');
    }
    this.focusedVM = '';
  }

  focusVM(index){
    this.focusedVM = String(index);
    for(var i = 0; i < this.cards.length; i++){
      if(i !== index && this.cards[i].isFlipped ){
        //console.log("Index = " + index + " && i = " + i);
        this.cards[i].isFlipped = false;
        this.cards[i].lazyLoaded = false;
        this.cards[i].template = 'none';
      }
    }
  }

  goToDevices(index){
    this.router.navigate(
      new Array('').concat([ "vm", this.cards[index].id, "devices", this.cards[index].name ])
    );
  }
  cloneVM(index){
    this.loader.open();
    this.loaderOpen = true;
    this.ws.call('vm.clone', [this.cards[index].id]).subscribe((res)=>{
      this.loader.close();
      this.getVmList();
    },
  (eres)=>{
    new EntityUtils().handleError(this, eres); 
    this.loader.close();
    });
  }
  toggleForm(flipState, card, template){
    // load #cardBack template with code here
    //console.log(flipState);
    card.template = template;
    card.isFlipped = flipState;
    card.lazyLoaded = !card.lazyLoaded;
    var index = this.cards.indexOf(card);
    this.focusVM(index);
  }

  // toggles VM on/off
  toggleVmState(index){
    let vm = this.cards[index];
    let eventName: string;
    if (vm.state != 'running') {
      eventName = "VmStart";
    } else {
      eventName = "VmStop";
    }
    this.core.emit({name: eventName, data:[vm.id]});
  }

  powerBtnLabel(state){
    if(state == 'stopped'){
      return "Start VM";
    } else if(state == 'running'){
      return "Stop VM";
    }
  }

  cardStyles(){
    let cardStyles = {
      'width':this.viewMode.value == 'slim' ? '288px' : '480px',  
      'height': '400px',
      'margin': '50px auto'
    }
    return cardStyles;
  }

  vnc(index){
    let vm = this.cards[index];
    this.ws.call('vm.get_vnc_web', [ vm.id ]).subscribe((res) => {
      for (let item in res){
        window.open(res[item]);
      }   
    }); 
  }

  checkVnc(devices){
    if(!devices || devices.length == 0){
      console.warn("Devices not found");
      return false;
    }
    for(let i=0; i < devices.length; i++){
      if(devices && devices[i].dtype == "VNC"){
        return devices[i].attributes.vnc_web;
      }
    }
  }

  checkStatus(id?:number){
    if(id){
      this.core.emit({
        name:"VmStatusRequest",
        data:[id]
      });
    } else {
      for(let i = 0; i < this.cache.length; i++){ 
        this.core.emit({
          name:"VmStatusRequest",
          data:[this.cache[i].id]
        });
    }
    }
  }

}
