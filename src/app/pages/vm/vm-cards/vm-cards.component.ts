import { Component, OnInit, AfterViewInit, Input, ElementRef, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
//import { FlexLayoutModule } from '@angular/flex-layout';
import { MaterialModule, MdButtonToggleGroup } from '@angular/material';
import { EntityModule } from '../../common/entity/entity.module';
import { WebSocketService, RestService } from '../../../services/';
import { DialogService } from '../../../services/dialog.service';
import { AppLoaderService } from '../../../services/app-loader/app-loader.service';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/observable/fromEvent';


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

  constructor(protected ws: WebSocketService,protected rest: RestService, private dialog: DialogService,protected loader: AppLoaderService,protected router: Router){}

  ngOnInit() {
    this.getVmList('init');
    this.viewMode.value = "cards";
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

  getVmList(init?:string) {
    this.rest.get('vm/vm', {}).subscribe((res) => {
      console.log('getVmList');
      console.log(res);
      for(var i = 0; i < res.data.length; i++){
	var card = this.parseResponse(res.data[i]);
	//console.log(card);
	this.cache.push(card);
	//this.pwrBtnLabel = this.pwrBtnOptions[this.cache[i].state];
      }   
      if(init){
	this.displayAll();
      } else {
	this.updateCards();
      }
    })  
  }

  getVm(index,id?:any) {
    if(this.cards[index].isNew && id){
      console.log(id);
      this.cards[index].isNew = false;
      this.cards[index].id = id;
    } 

    this.rest.get('vm/vm/'+this.cards[index].id, {}).subscribe((res) => {
      var card = this.parseResponse(res.data);
      this.cards[index] = card;
      this.updateCache();
    })  
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
    //let id: any;
    //console.log(id);
    /*
    if(evnt.data.id){
      id = evnt.data.id
    } else {
      id = evnt;
    }
     */
    this.getVm(index,id);
  }


  addVM(){
    let index = this.cards.length;
    let card: VmProfile = { 
      name:"",
      description:"",
      info:"",
      bootloader:"",
      state:"",
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
	this.rest.delete( 'vm/vm/' + this.cards[index].id, {}).subscribe(
	  (res) => {
	    console.log("deleteVM: REST response...");
	    console.log(res);
	    this.focusedVM = '';
	    this.cards.splice(index,1);
	    this.loader.close();
	    this.updateCache();
	  }/*,
	  (res) => { 
	    new EntityUtils().handleError(this, res);
	    this.loader.close(); 
	  }*/
	);        
      }
    })
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
    let action: string;
    let rpc: string;
    if (vm.state != 'running') {
      rpc = 'vm.start';
    } else {
      rpc = 'vm.stop';
    }
    this.ws.call(rpc, [ vm.id ]).subscribe((res) => {
      console.log(this.cards[index].state);
      this.refreshVM(index,vm.id);
      //this.pwrBtnLabel = this.pwrBtnOptions[this.cards[index].state];
    });
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
