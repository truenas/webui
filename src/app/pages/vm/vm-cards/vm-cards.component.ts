import { Component, OnInit, Input, TemplateRef } from '@angular/core';
import { MaterialModule } from '@angular/material';
import { EntityModule } from '../../common/entity/entity.module';
import { WebSocketService, RestService } from '../../../services/';
import { DialogService } from '../../../services/dialog.service';
import { AppLoaderService } from '../../../services/app-loader/app-loader.service';


interface VmProfile {
  name:string;
  id:string;
  description:string;
  info:string;
  bootloader:string;
  state:string;
  autostart:string;
  vcpus:string;
  memory:string;
  lazyLoaded:boolean;
  template:string; // for back face of card
  cardActions?:Array<any>;
}

@Component({
  selector: 'vm-cards',
  templateUrl: './vm-cards.component.html',
  styleUrls: ['./vm-cards.component.css']
})
export class VmCardsComponent implements OnInit {

  @Input() cards = [];
  //public lazyLoaded = false;
  public tpl = "edit";
  private pwrBtnLabel: string;
  private pwrBtnOptions = {
    stopped: "Start VM",
    running: "Stop VM"
  }
  protected loaderOpen: boolean = false;

  constructor(protected ws: WebSocketService,protected rest: RestService, private dialog: DialogService,protected loader: AppLoaderService){}

  ngOnInit() {
    this.getVmList();
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
      template:'none'
    }   
    return card;
  }

  getVmList() {
    this.rest.get('vm/vm', {}).subscribe((res) => {
      //console.log(res);
      for(var i = 0; i < res.data.length; i++){
	var card = this.parseResponse(res.data[i]);
	//console.log(card);
	this.cards.push(card);
	this.pwrBtnLabel = this.pwrBtnOptions[this.cards[i].state];
      }   
    })  
  }

  getVm(index) {
    this.rest.get('vm/vm/'+this.cards[index].id, {}).subscribe((res) => {
      //console.log(res);
      var card = this.parseResponse(res.data);
      this.cards[index] = card;
      //this.cards.push(card);
    })  
  }

  refreshVM(index){
    this.getVm(index);
  }

/*
  addVM(){
    var card: VmProfile = { 
      name:"",
      id:"",
      description:"",
      info:"",
      bootloader:"",
      state:"",
      autostart:"",
      vcpus:"",
      memory:""
    }   
    this.cards.push(card);
  }
*/

  deleteVM(index) {
    this.dialog.confirm("Delete", "Are you sure you want to delete it?").subscribe((res) => {
      if (res) {
	this.loader.open();
	this.loaderOpen = true;
	let data = {};
	this.rest.delete( 'vm/vm/' + this.cards[index].id, {}).subscribe(
	  (res) => {
	    this.cards.splice(index,1);
	    this.loader.close();
	    //this.getVmList();
	  }/*,
	  (res) => { 
	    new EntityUtils().handleError(this, res);
	    this.loader.close(); 
	  }*/
	);        
      }
    })
  }

  focusVM(index){
    console.log("FOCUSVM METHOD *******************");
    for(var i = 0; i < this.cards.length; i++){
      if(i !== index && this.cards[i].isFlipped ){
	console.log("Index = " + index + " && i = " + i);
	this.cards[i].isFlipped = false;
	this.cards[i].lazyLoaded = false;
	this.cards[i].template = 'none';
      }
    }
  }

  toggleForm(flipState, card, template){
    // load #cardBack template with code here
    card.template = template;
    card.isFlipped = flipState;
    card.lazyLoaded = !card.lazyLoaded;
    var index = this.cards.indexOf(card);
    this.focusVM(index);
  }

  // toggles VM on/off
  toggleVmState(index){
    let vm = this.cards[index];
    let action: string;
    let rpc: string;
    if (vm.state != 'RUNNING') {
      rpc = 'vm.start';
    } else {
      rpc = 'vm.stop';
    }
    this.ws.call(rpc, [ vm.id ]).subscribe((res) => {
      console.log([vm.id]);
      this.refreshVM(index);
      this.pwrBtnLabel = this.pwrBtnOptions[this.cards[index].state];
    });
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
