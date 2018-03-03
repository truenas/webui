import { Component, OnInit, Input, ViewChild, OnChanges } from '@angular/core';
import { CoreServiceInjector } from 'app/core/services/coreserviceinjector';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { WidgetNoteComponent } from 'app/core/components/widgets/widgetnote/widgetnote.component';
import { WidgetComponent } from 'app/core/components/widgets/widget/widget.component';
import {RestService,WebSocketService} from 'app/services/';

interface NoteCard {
  id?:string;
  title?:string;
  content?:string;
  lazyLoaded?:boolean;
  template?:string; // for back face of card
  cardActions?:Array<any>;
  isNew:boolean;
}

@Component({
  selector: 'widget-notes-collection',
  templateUrl:'./widgetnotescollection.component.html',
  styleUrls: ['./widgetnotescollection.component.css'],
})
export class WidgetNotesCollectionComponent extends WidgetComponent implements OnInit, OnChanges {

  public title:string = "Notes";
  @Input() widgetFlex:string;
  @Input() collectionLayout:string;
  public notes:any[] = [];

  constructor(private rest: RestService, private ws: WebSocketService){
    super();
  }

  ngOnChanges(changes){
    //console.log(changes);
    }

  ngOnInit(){
    //API Calls here?
    this.getNotes();
  }

  getNotes(){
    this.rest.get("account/users/1", {}).subscribe((res) => {
      console.log("******** GETTING NOTES ********");
      console.log(res);
      this.notes = [];
      for (let i in res.data.bsdusr_attributes) {
        console.log(i);
        let content = res.data.bsdusr_attributes[i];
        if (i.includes('note_')) {
          let key = i.split('note_');
          let title = key[1]
          let note = {title:title, content:content}
          this.notes.push(note);
        }
      }
      /*
      for (let i = 0; i < this.notes.length; i++) {
        let card = this.parseResponse(this.notes[i]);
        this.notes.push(card);
      }*/
    });
  }
/*
  parseResponse(data){
    
    const card: NoteCard = {
      //id:key[0],
      title:key[0].substring(5),
      content:data[key[0]],
      //lazyLoaded: false,
      //template:'none',
      isNew:false
    }
    let card = data
    return card;
  }*/
}
