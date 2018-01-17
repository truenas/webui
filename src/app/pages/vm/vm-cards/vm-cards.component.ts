import { Component, OnInit, AfterViewInit, Input, ElementRef, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MaterialModule, MdButtonToggleGroup } from '@angular/material';
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
  template?:string; // for back face of card
  cardActions?:Array<any>;
  isNew:boolean;
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
  @ViewChild('viewMode') viewMode:MdButtonToggleGroup;
  focusedVM:string;


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
     * Register the component with the EventBus 
     * and subscribe to the observable it returns
     */
    this.core.register({observerClass:this,eventName:"VmProfiles"}).subscribe((evt:CoreEvent) => {
      console.log("VmProfiles! *********");
      console.log(evt);
      this.setVmList(evt,'init');
    });

    this.core.register({observerClass:this,eventName:"VmProfile"}).subscribe((evt:CoreEvent) => {
      console.log("VmProfile! *********");
      console.log(evt);
      this.setVm(evt);
    });

    this.core.register({observerClass:this,eventName:"VmStarted"}).subscribe((evt:CoreEvent) => {
      console.log("VmStarted! *********");
      console.log(evt);
      let index = this.getCardIndex('id',evt.sender[0]);
      this.refreshVM(index,evt.sender[0]); // Can't use this because API doesn't return vm.id
    });

    this.core.register({observerClass:this,eventName:"VmStopped"}).subscribe((evt:CoreEvent) => {
      console.log("VmStopped! *********");
      console.log(evt);
      let index = this.getCardIndex('id',evt.sender[0]);
      this.refreshVM(index,evt.sender[0]); // Workaround: sender returns the request params
    });

    this.core.register({observerClass:this,eventName:"VmDeleted"}).subscribe((evt:CoreEvent) => {
      console.log("VmDeleted! *********");
      console.log(evt);
      this.removeVM(evt); // Workaround: sender returns the request params
    });

    this.getVmList();
  }

  getCardIndex(key,value){
    for(let i = 0; i < this.cards.length; i++){
      if(this.cards[i][key] == value){
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
    console.log(key + '/' + query);
    if(query == '' || !query){
      this.displayAll();
    } else {
      this.cards = this.cache.filter((card) => {
        console.log(card[key]);
        var result = card[key].toLowerCase().indexOf(query.toLowerCase()) > -1;
        //if(result !== -1){ 
        console.log(result)
        return result;
        //}
        });
      console.log("**** this.display ****");
      console.log(this.cards);
    }
  }

  parseResponse(data){
    var card: VmProfile = { 
      name:data.name,
      id:data.id,
      description:data.description,
      info:data.info,
      bootloader:data.bootloader,
      state:data.state.toLowerCase(),
      autostart:data.autostart,
      vcpus:data.vcpus,
      memory:data.memory,
      lazyLoaded: false,
      template:'none',
      isNew:false,
      cardActions:[]
    }   
    return card;
  }

  getVmList(){
    this.core.emit({name:"VmProfilesRequest"});
  }

  setVmList(res:CoreEvent, init?:string) { 
    for(var i = 0; i < res.data.length; i++){
      var card = this.parseResponse(res.data[i]);
      this.cache.push(card);
    }   
    if(init){
      this.displayAll();
    } else {
      this.updateCards();
    }
  }


  getVm(index,id?:any) {
    if(this.cards[index].isNew && id){
      console.log(id);
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
    let currentIndex = this.getCardIndex("id",res.id)
    if(!res.state){
      //DEBUG: console.log(currentIndex);
      let currentState = this.cards[currentIndex].state;
      res.state = currentState;
    }
    let card = this.parseResponse(res);
    let index = currentIndex;
    
    // delay to allow flip animation
    setTimeout( () => {
      this.cards[index] = card;
      this.updateCache();
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


  deleteVM(index) {
    this.dialog.confirm("Delete", "Are you sure you want to delete " + this.cards[index].name + "?").subscribe((res) => {
      if (res) {
        this.loader.open();
        this.loaderOpen = true;
        let data = {};
        this.core.emit({name:"VmDelete", data:[this.cards[index].id], sender:index});
        /*this.rest.delete( 'vm/vm/' + this.cards[index].id, {}).subscribe(
          (res) => {
            console.log("deleteVM: REST response...");
            console.log(res);
            this.focusedVM = '';
            this.cards.splice(index,1);
            this.loader.close();
            this.updateCache();
          },
          (res) => { 
            new EntityUtils().handleError(this, res);
            this.loader.close(); 
          }
        );*/
      }
    })
  }

  removeVM(evt:CoreEvent){
    console.log("removeVM ********");
    console.log(evt);
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
    console.log("TOGGLE-VM-STATE");
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
    var vm = this.cards[index];
    this.ws.call('vm.get_vnc_web', [ vm.id ]).subscribe((res) => {
      for (let item in res){
        window.open(res[item]);
      }   
    }); 
  }
}
