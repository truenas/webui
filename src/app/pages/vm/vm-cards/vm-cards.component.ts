
import {interval as observableInterval,  Observable ,  Subject } from 'rxjs';
import { Component, OnInit, OnDestroy, Input, ElementRef, ViewChild} from '@angular/core';
import { UUID } from 'angular2-uuid';
import { Router } from '@angular/router';
import { MatButtonToggleGroup } from '@angular/material/button-toggle';
import { WebSocketService, RestService } from '../../../services/';
import { DialogService } from '../../../services/dialog.service';
import { AppLoaderService } from '../../../services/app-loader/app-loader.service';




import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { MatDialog } from '@angular/material';
import { T } from '../../../translate-marker';


interface VmProfile {
  name?:string;
  id?:string;
  domId?: string;
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
  vm_type?: string;
  vm_comport?:string
  isNew?:boolean;
  transitionalState?:boolean;
}

@Component({
  selector: 'vm-cards',
  templateUrl: './vm-cards.component.html',
  styleUrls: ['./vm-cards.component.css'],
})
export class VmCardsComponent implements OnInit, OnDestroy {

  @ViewChild('filter') filter: ElementRef; 
  @Input() searchTerm = '';
  @Input() cards = []; // Display List
  @Input() cache = []; // Master List:
  @ViewChild('viewMode') viewMode:MatButtonToggleGroup;
  focusedVM:string;
  protected dialogRef: any;
  public raw_file_path: string;
  public raw_file_path_size: string;

  public controlEvents:Subject<CoreEvent> = new Subject();
  public tpl = "edit";
  //private pwrBtnLabel: string;
  private pwrBtnOptions = {
    stopped: "Start VM",
    running: "Stop VM"
  }
  protected loaderOpen = false;

  public spin = true;
  public direction ='down';
  public animationMode = 'fling';
  public off_text: string;  
  public off_button_text: string;

  public actions: any = [
    {
      label : "Add VM",
      icon: "add",
      onClick : () => {
        this.addVMWizard();
      }
    }
  ]

  constructor(protected ws: WebSocketService,protected rest: RestService,private core:CoreService, 
    private dialog: DialogService,protected loader: AppLoaderService,protected router: Router,
    protected matdialog: MatDialog){}

  ngOnDestroy(){
    this.core.unregister({observerClass:this});
  }

  ngOnInit() {
    this.viewMode.value = "cards";
    /* TODO: remove this after middleware part is ready to give back
    correct state.
    */
    observableInterval(5000).subscribe((val) => {
      this.checkStatus();
     });
    /*
     * Communication Downwards:
     * Listen for events from UI controls
     * */

    this.controlEvents.subscribe((evt:CoreEvent) => {
      //if(evt.sender){
        const index = this.getCardIndex("id",evt.sender.machineId);
      //}
      switch(evt.name){
        case "FormSubmitted":
          //evt.data.autostart = evt.data.autostart.toString();
          this.cards[index].state = "Saving"
          const profile = this.stripUIProperties(evt.data);
          if(evt.sender.isNew){
            const i = this.getCardIndex('isNew',true);
            this.cards[i].name = evt.data.name;
            this.cards[i].state = "Loading...";
            this.core.emit({name:"VmCreate",data:[profile] ,sender:evt.sender.machineId});
          } else {
            const formValue = this.parseResponse(evt.data,true);
            this.core.emit({name:"VmProfileUpdate",data:[evt.sender.machineId,this.stripUIProperties(formValue)] ,sender:evt.sender.machineId});
            this.toggleForm(false,this.cards[index],'none'); 
          }
        break;
        case "FormCancelled":
          this.cancel(index);
        break;
        case "CloneVM":
          this.cards[index].state = "creating clone";
          this.cancel(index);
          this.core.emit({name:"VmClone", data: this.cards[index].id, sender:this});
          this.core.register({observerClass:this,eventName:"VmProfilesRequest"}).subscribe((clone_evt:CoreEvent) => {
           if (clone_evt.data && clone_evt.data.trace) {
            this.dialog.errorReport(
              T('VM clone failed.') , clone_evt.data.reason, clone_evt.data.trace.formatted).subscribe((result)=>{
                this.core.emit({name:"VmProfilesRequest"});
              })
           };
          })
        break;
        case "RestartVM":
          this.restartVM(index);
        break;
      default:
      break;
      }

    });

    /*
     * Communication Upwards:
     * Register the component with the EventBus
     * and subscribe to the observable it returns
     */
    this.core.register({observerClass:this,eventName:"VmProfiles"}).subscribe((evt:CoreEvent) => {
      this.setVmList(evt,'init');
    });

    this.core.register({observerClass:this,eventName:"VmProfile"}).subscribe((evt:CoreEvent) => {
      this.setVm(evt);
    });

    this.core.register({observerClass:this,eventName:"VmStatus"}).subscribe((evt:CoreEvent) => {
      evt.data.forEach(vmstatus => {
        const cardIndex = this.getCardIndex('id',vmstatus.id);
        if(vmstatus.state && this.cards[cardIndex]){
          this.cards[cardIndex].state = vmstatus.state.toLowerCase();
          const cacheIndex = this.getCardIndex('id',vmstatus.id,true);
          this.cache[cacheIndex].state = vmstatus.state.toLowerCase();
        };
      });

    });
    this.core.register({observerClass:this,eventName:"VmStarted"}).subscribe((evt:CoreEvent) => {
        if (evt.data.trace) {
          this.dialog.errorReport(T('VM failed to start') , evt.data.reason, evt.data.trace.formatted)
          const cardIndex = this.getCardIndex('id',evt.data.id[0]);
          this.cards[cardIndex].state = 'stopped';
  
          const cacheIndex = this.getCardIndex('id',evt.data.id[0],true);
          this.cache[cacheIndex].state = 'stopped';
        } else {
          const cardIndex = this.getCardIndex('id',evt.data.id);
          this.cards[cardIndex].state = 'running';
          this.cards[cardIndex].transitionalState = false;
  
          const cacheIndex = this.getCardIndex('id',evt.data.id,true);
          this.cache[cacheIndex].state = 'running';
          this.cache[cacheIndex].transitionalState =  false;
        }
    });

    this.core.register({observerClass:this,eventName:"VmStopped"}).subscribe((evt:CoreEvent) => {
      const cardIndex = this.getCardIndex('id',evt.data.id);
      this.cards[cardIndex].state = 'stopped';
      this.cards[cardIndex].transitionalState = false;

      const cacheIndex = this.getCardIndex('id',evt.data.id,true);
      this.cache[cacheIndex].state = 'stopped';
      this.cache[cacheIndex].transitionalState =  false;
    });

    this.core.register({observerClass:this,eventName:"VmCreated"}).subscribe((evt:CoreEvent) => {
      const index = this.getCardIndex('isNew', true);
      this.toggleForm(false,this.cards[index],'none');
      this.core.emit({name:"VmProfilesRequest"});
    });

    this.core.register({observerClass:this,eventName:"VmDeleted"}).subscribe((evt:CoreEvent) => {
      this.removeVM(evt); // Workaround: sender returns the request params
    });

    this.getVmList();
  }

  getCardIndex(key:any,value:any,cache?:boolean){
    let target: any[];
    if(cache === true){
      target = this.cache;
    } else{
      target = this.cards;
    }
    for(let i = 0; i < target.length; i++){
      if(target[i][key] === value){
        return i;
      }
    }
  }

  displayAll(){
    for(let i = 0; i < this.cache.length; i++){
      this.cards[i] = Object.assign({}, this.cache[i]);
    }
  }

  displayFilter(key,query?){
    if(query === '' || !query){
      this.displayAll();
    } else {
      this.cards = this.cache.filter((card) => {
        const result = card[key].toLowerCase().indexOf(query.toLowerCase()) > -1;
        //if(result !== -1){
        return result;
        //}
        });
    }
  }

  parseResponse(data:any, formatForUpdate?:boolean){
    let card: VmProfile = {
      name:data.name,
      description:data.description,
      info:data.info,
      bootloader:data.bootloader,
      autostart:data.autostart,
      vcpus:data.vcpus,
      memory:data.memory,
      //lazyLoaded: false,
      devices:data.devices,
      vm_type: data.vm_type,
      domId: "id-" + UUID.UUID(),
      transitionalState: false
    }

    // Leave out properties not used for update requests
    if(formatForUpdate){
      return card;
    }

    card.vm_type = data.vm_type,
    card.vm_comport = '/dev/nmdm' +String(data.id)+ 'B'
    card.template = 'none',
    //card.cardActions = [],
    card.vnc = false, // Until we verify otherwise we assume false
    card.isNew = false,
    card.id = data.id;
    card.state = "Loading...";
    card.vnc = false; // Until we verify otherwise we assume false
    card.lazyLoaded = false;
    card.template = 'none';
    card.isNew = false;
    //cardActions:[]
    if(card.devices.length > 0){
      card.vnc = this.checkVnc(card.devices);
    }
    return card;
  }

  scrollTo(destination:string){
    //console.log(destination)
    this.core.emit({name:"ScrollTo", data: "#" + destination});
  }

  getVmList(){
    this.core.emit({name:"VmProfilesRequest"});
  }

  setVmList(res:CoreEvent, init?:string) {
    //const cacheLength = this.cache.length
    let scroll:boolean = false;
    if(this.cache.length != 0 && this.cache.length < res.data.length){;
      // Put window scroll stuff here
      scroll = true;
    }

    this.cache = [];
    for(let i = 0; i < res.data.length; i++){
      let card = this.parseResponse(res.data[i]);
      this.cache.push(card);
    }

    if(init){
      this.displayAll();
    } else {
      this.updateCards();
    }

    this.checkStatus();
    if(scroll && this.cards.length == res.data.length){
      setTimeout(()=>{
      let test = (<any>document).querySelector('.vm-card-' + this.cards[this.cards.length-1].id);
      this.scrollTo(String(this.cards[this.cards.length-1].domId));
      
      //this.scrollTo('#animation-target');
      },1000);
    }

  }


  getVm(index,id?:any) {
    if(this.cards[index].isNew && id){
      this.cards[index].isNew = false;
      this.cards[index].id = id;
    }
    this.core.emit({
      name:"VmProfileRequest",
      data:[[["id", "=", String(this.cards[index].id)]]]
    });
  }

  setVm(evt:CoreEvent){
    const res = evt.data[0];
    const currentIndex = this.getCardIndex("id",res.id);
    const cacheIndex = this.getCardIndex("id",res.id);

    if(!res.state){
      const currentState = this.cards[currentIndex].state;
      //res.state = currentState;
    }
    const card = this.parseResponse(res);
    const index = currentIndex;


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
    const result = [];
    for(let i = 0; i < this.cards.length; i++){
      for(let ii = 0; ii < this.cache.length; ii++){
        if(this.cache[ii].id === this.cards[i].id){
          const newCard = Object.assign({}, this.cache[ii]);
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
    const index = this.cards.length;
    const card: VmProfile = {
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
      transitionalState: false,
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
  addDockerVMWizard(){
    this.router.navigate(
      new Array('').concat([ "vm", "dockerwizard" ])
    );
  }

  deleteVM(index) {
    this.dialog.confirm("Delete", "Delete " + this.cards[index].name + "?").subscribe((res) => {
      if (res) {
        this.loader.open();
        this.loaderOpen = true;
        const data = {};
        this.cards[index].state = "deleting"
        this.core.emit({name:"VmDelete", data:[this.cards[index].id], sender:index});
      }
    })
  }

  restartVM(index:number){ 
    const vm = this.cards[index];
    vm.transitionalState = true;
    vm.state = "restarting"
    this.core.emit({name:"VmRestart", data: [vm.id]});
  }

  removeVM(evt:CoreEvent){
    const index = this.getCardIndex("id", evt.sender);

    this.focusedVM = '';
    this.cards.splice(index,1);
    this.loader.close();
    //this.updateCache();
    this.getVmList();
  }

  cancel(index){
    const card = this.cards[index];
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
    for(let i = 0; i < this.cards.length; i++){
      if(i !== index && this.cards[i].isFlipped ){
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

  toggleForm(flipState, card, template){
    // load #cardBack template with code here
    card.template = template;
    card.isFlipped = flipState;
    card.lazyLoaded = !card.lazyLoaded;
    const index = this.cards.indexOf(card);
    this.focusVM(index);
  }

  // toggles VM on/off
  toggleVmState(index, poweroff?:boolean){
    if (index.force) {
      poweroff = index.force;
      index = index.index;
    };
    const vm = this.cards[index];
    if(vm.transitionalState){
      return ;
    } else {
      // Use transitionalState to avoid errors from multiple button presses
      vm.transitionalState = true;
    }
    let eventName: string;
    if (vm.state !== 'running') {
      this.ws.call('vm.query', [[['id', '=', vm.id]]]).subscribe((res)=>{
            eventName = "VmStart";
            // removed transient state `starting` as it would cause confusion with new requirements.
            //this.cards[index].state = "starting";
            this.core.emit({name: eventName, data:[vm.id]});
      });
    }
     else {
      if(poweroff){
         this.off_text =  `Turn off power to virtual machine "${vm.name}"?`;
         this.off_button_text = 'Power off';
      }
      else {
        this.off_text =  `Stop virtual machine "${vm.name}"?`;
        this.off_button_text = 'Stop virtual machine';
      }
        this.dialog.confirm("Alert",this.off_text, false, this.off_button_text).subscribe((res)=>{
          if(res) {
           if(poweroff){
             eventName = "VmPowerOff";
             this.cards[index].state = "stopping";
             this.core.emit({name: eventName, data:[vm.id]});
           } else {
             eventName = "VmStop";
             this.cards[index].state = "stopping";
             this.core.emit({name: eventName, data:[vm.id]});
           }
          } else {
            vm.transitionalState = false;
          }
        })
    }
  }

  powerBtnLabel(state){
    if(state === 'stopped'){
      return "Start VM";
    } else if(state === 'running'){
      return "Stop VM";
    }
  }

  cardStyles(){
    const cardStyles = {
      'width':this.viewMode.value === 'slim' ? '288px' : '480px',
      'height': '400px',
      'margin': '50px auto'
    }
    return cardStyles;
  }

  vnc(index){
    const vm = this.cards[index];
    this.ws.call('vm.get_vnc_web', [ vm.id ]).subscribe((res) => {
      for (const item in res){
        window.open(res[item]);
      }
    });
  }

  serial(index){
    const vm = this.cards[index];
    this.router.navigate(
      new Array('').concat([ "vm","serial", vm.id])
    );
  }

  checkVnc(devices){
    if(!devices || devices.length === 0){
      return false;
    }
    for(let i=0; i < devices.length; i++){
      if(devices && devices[i].dtype === "VNC"){
        return devices[i].attributes.vnc_web;
      }
    }
  }

  checkStatus(id?:number){ 
    this.core.emit({
      name:"VmStatusRequest",
      data:[]
    });
  }
  
  stripUIProperties(profile:VmProfile){
    let clone = Object.assign({}, profile);
    delete clone.domId;
    delete clone.transitionalState;
    return clone;
  }
}
