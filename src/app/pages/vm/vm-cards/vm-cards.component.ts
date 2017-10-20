import { Component, OnInit, Input, TemplateRef } from '@angular/core';
import { MaterialModule } from '@angular/material';
import { EntityModule } from '../../common/entity/entity.module';
import { RestService } from '../../../services/';


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
  cardActions?:Array<any>;
}

@Component({
  selector: 'vm-cards',
  templateUrl: './vm-cards.component.html',
  styleUrls: ['./vm-cards.component.css']
})
export class VmCardsComponent implements OnInit {

  @Input() cards = [];
  public lazyLoaded = false;
  public tpl = "edit";

  constructor(protected rest: RestService){}

  ngOnInit() {
    this.getUserList();
  }

  getUserList() {
    this.rest.get('vm/vm', {}).subscribe((res) => {
      console.log(res);
      for(var i = 0; i < res.data.length; i++){
	var card: VmProfile = {
	  name:res.data[i].name,
	  id:res.data[i].id,
	  description:res.data[i].description,
	  info:res.data[i].info,
	  bootloader:res.data[i].bootloader,
	  state:res.data[i].state,
	  autostart:res.data[i].autostart,
	  vcpus:res.data[i].vcpus,
	  memory:res.data[i].memory
	}
	//if(res.data[i].bsdusr_full_name == ""){
	//card.fullname = res.data[i].bsdusr_username;
	//}
	//console.log(card);
	this.cards.push(card);
      }
    })
  }

  toggleForm(state, card, template){
    // load #cardBack template with code here
    this.tpl = template;
    card.isFlipped = state;
    this.lazyLoaded = !this.lazyLoaded;
  }
}
