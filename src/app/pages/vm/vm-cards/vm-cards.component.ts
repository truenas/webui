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
import { MatDialog, MatDialogRef, MatSnackBar } from '@angular/material';
import { EntityJobComponent } from '../../common/entity/entity-job/entity-job.component';

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
  vm_type?: string;
  vm_comport?:string
  isNew?:boolean;
}

@Component({
  selector: 'vm-cards',
  templateUrl: './vm-cards.component.html',
  styleUrls: ['./vm-cards.component.css'],
})
export class VmCardsComponent implements OnInit {

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

  public spin: boolean = true;
  public direction: string = 'down';
  public animationMode: string = 'fling';

  public actions: any = [{
      label : "Add DockerVM",
      icon: "picture_in_picture",
      onClick : () => {
         this.addDockerVMWizard();
       }
    }, {
      label : "Add VM",
      icon: "beach_access",
      onClick : () => {
        this.addVMWizard();
      }
    }
  ]

  constructor(protected ws: WebSocketService,protected rest: RestService,private core:CoreService, 
    private dialog: DialogService,protected loader: AppLoaderService,protected router: Router,
    protected matdialog: MatDialog){}
    
  ngOnInit() {
    this.viewMode.value = "cards";
    /*
     * Communication Downwards:
     * Listen for events from UI controls
     * */
    
    this.controlEvents.subscribe((evt:CoreEvent) => {
      const index = this.getCardIndex("id",evt.sender.machineId);
      switch(evt.name){
        case "FormSubmitted":
          //evt.data.autostart = evt.data.autostart.toString();
          if(evt.sender.isNew){
            const i = this.getCardIndex('isNew',true);
            this.cards[i].name = evt.data.name;
            this.cards[i].state = "Loading...";
            this.core.emit({name:"VmCreate",data:[evt.data] ,sender:evt.sender.machineId});
          } else {
            const formValue = this.parseResponse(evt.data,true);
            this.core.emit({name:"VmProfileUpdate",data:[evt.sender.machineId,formValue] ,sender:evt.sender.machineId});
            this.toggleForm(false,this.cards[index],'none');
            //this.refreshVM(index,evt.sender.machineId);
          }
        break;
        case "FormCancelled":

          this.cancel(index);
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
      let cardIndex = this.getCardIndex('id',evt.data.id);
      this.cards[cardIndex].state = evt.data.state.toLowerCase();

      let cacheIndex = this.getCardIndex('id',evt.data.id,true);
      this.cache[cacheIndex].state = evt.data.state.toLowerCase();
    });

    this.core.register({observerClass:this,eventName:"VmStarted"}).subscribe((evt:CoreEvent) => {
      let cardIndex = this.getCardIndex('id',evt.data.id);
      this.cards[cardIndex].state = 'running';

      let cacheIndex = this.getCardIndex('id',evt.data.id,true);
      this.cache[cacheIndex].state = 'running';
    });

    this.core.register({observerClass:this,eventName:"VmStopped"}).subscribe((evt:CoreEvent) => {
      let cardIndex = this.getCardIndex('id',evt.data.id);
      this.cards[cardIndex].state = 'stopped';

      let cacheIndex = this.getCardIndex('id',evt.data.id,true);
      this.cache[cacheIndex].state = 'stopped';
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
    const card: VmProfile = { 
      name:data.name,
      description:data.description,
      info:data.info,
      bootloader:data.bootloader,
      autostart:data.autostart,
      vcpus:data.vcpus,
      memory:data.memory,
      //lazyLoaded: false,
      devices:data.devices,
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

  getVmList(){
    this.core.emit({name:"VmProfilesRequest"});
  }

  setVmList(res:CoreEvent, init?:string) { 
    this.cache = [];
    for(let i = 0; i < res.data.length; i++){
      const card = this.parseResponse(res.data[i]);
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
    this.dialog.confirm("Delete", "Are you sure you want to delete " + this.cards[index].name + "?").subscribe((res) => {
      if (res) {
        this.loader.open();
        this.loaderOpen = true;
        const data = {};
        this.core.emit({name:"VmDelete", data:[this.cards[index].id], sender:index});
      }
    })
  }

  removeVM(evt:CoreEvent){
    const index = this.getCardIndex("id", evt.sender);

    this.focusedVM = '';
    this.cards.splice(index,1);
    this.loader.close();
    this.updateCache();
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
    card.template = template;
    card.isFlipped = flipState;
    card.lazyLoaded = !card.lazyLoaded;
    const index = this.cards.indexOf(card);
    this.focusVM(index);
  }

  // toggles VM on/off
  toggleVmState(index){
    const vm = this.cards[index];
    let eventName: string;
    if (vm.state !== 'running') {
      this.ws.call('vm.query', [[['id', '=', vm.id]]]).subscribe((res)=>{
        for (const device of res[0].devices){
          if(device.dtype === 'RAW' && device.attributes.boot){
            this.raw_file_path = device.attributes.path;
            this.raw_file_path_size = String(device.attributes.size);
          }
        }
          if (res[0].vm_type === "Container Provider"){
            this.dialogRef = this.matdialog.open(EntityJobComponent, { data: {title: 'Fetching RancherOS'}, disableClose: false});
            this.dialogRef.componentInstance.progressNumberType = "nopercent";
            this.dialogRef.componentInstance.setCall('vm.fetch_image', ['RancherOS']);
            this.dialogRef.componentInstance.submit();
            this.dialogRef.componentInstance.success.subscribe((sucess_res) => {
              this.loader.open();
              this.ws.call('vm.image_path', ['RancherOS']).subscribe((img_path)=>{
                if(!img_path){
                  this.dialog.Info('CHECKSUM MISMATCH', 'system checks failed to verify ISO, please try to start again');
                  this.loader.close();
                  return;
                };
                this.ws.call('vm.decompress_gzip',[img_path, this.raw_file_path]).subscribe((decompress_gzip)=>{
                  this.ws.call('vm.raw_resize',[this.raw_file_path, this.raw_file_path_size]).subscribe((raw_resize)=>{
                    this.ws.call('vm.start',[this.cards[index].id]).subscribe((vm_start)=>{
                        this.loader.close();
                        if(!vm_start){
                          this.dialog.Info('ERROR', 'vm failed to start, please check system log.');
                          return;
                        }
                        this.refreshVM(index, this.cards[index].id);

                      });
                    },
                    (error_raw_resize)=>{
                      this.loader.close();
                      new EntityUtils().handleError(this, error_raw_resize);
                    })
                },(decompress_gzip)=>{
                  this.loader.close();
                  new EntityUtils().handleError(this, decompress_gzip);
              });
              },(error_img_path)=>{
                this.loader.close();
                new EntityUtils().handleError(this, error_img_path);
              });
              this.dialogRef.close(false);
              this.dialogRef.componentInstance.setDescription("");
            });
            this.dialogRef.componentInstance.failure.subscribe((failed_res) => {});
          }
          else {
            eventName = "VmStart";
            this.core.emit({name: eventName, data:[vm.id]});
          }
      });
    }
     else {
      eventName = "VmStop";
      this.core.emit({name: eventName, data:[vm.id]});
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
