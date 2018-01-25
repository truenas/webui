import { ChartFormatter } from '../../components/common/lineChart/lineChart.component';
import {Component, OnInit, AfterViewInit} from '@angular/core';
import * as _ from 'lodash';
import filesize from 'filesize';

import {
  RestService,
  SystemGeneralService,
  WebSocketService
} from '../../services/';
import { ChartConfigData, LineChartService } from 'app/components/common/lineChart/lineChart.service';
import { DialogService } from '../../services/dialog.service';
import { AppLoaderService } from '../../services/app-loader/app-loader.service';
import { ErdService } from 'app/services/erd.service';

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
  selector: 'dashboard',
  styleUrls: ['./dashboard.scss'],
  templateUrl: './dashboard.html',
  providers: [SystemGeneralService]
})
export class DashboardComponent implements OnInit, AfterViewInit {

  public info: any = {};
  public network_info: any = {};
  public ipAddress: any = [];
  public chartFormatter: ChartFormatter = {
    format(value, ratio, id) {
      return filesize(value, {standard: "iec"});
    }
  };
  public graphs: ChartConfigData[] = [
    {
      title: "Average Load",
      legends: ['Short Term', ' Mid Term', 'Long Term'],
      type: LineChartService.lineChart,
      dataList: [
        {'source': 'load', 'type': 'load', 'dataset': 'shortterm'},
        {'source': 'load', 'type': 'load', 'dataset': 'midterm'},
        {'source': 'load', 'type': 'load', 'dataset': 'longterm'},
      ],
    },
    {
      title: "Memory (gigabytes)",
      type: LineChartService.lineChart,
      legends: ['Free', 'Active', 'Cache', 'Wired', 'Inactive'],
      dataList: [
        {'source': 'memory', 'type': 'memory-free', 'dataset': 'value'},
        {'source': 'memory', 'type': 'memory-active', 'dataset': 'value'},
        {'source': 'memory', 'type': 'memory-cache', 'dataset': 'value'},
        {'source': 'memory', 'type': 'memory-wired', 'dataset': 'value'},
        {'source': 'memory', 'type': 'memory-inactive', 'dataset': 'value'},
      ],
      divideBy: 1073741824 // Gigs worth of bytes
    },
    {
      title: "CPU Usage",
      type: LineChartService.lineChart,
      legends: ['User', 'Interrupt', 'System', 'Idle', 'Nice'],
      dataList: [
        {'source': 'aggregation-cpu-sum', 'type': 'cpu-user', 'dataset': 'value'},
        {'source': 'aggregation-cpu-sum', 'type': 'cpu-interrupt', 'dataset': 'value'},
        {'source': 'aggregation-cpu-sum', 'type': 'cpu-system', 'dataset': 'value'},
        {'source': 'aggregation-cpu-sum', 'type': 'cpu-idle', 'dataset': 'value'},
        {'source': 'aggregation-cpu-sum', 'type': 'cpu-nice', 'dataset': 'value'},
      ],
    },
    {
      title: "Uptime",
      type: LineChartService.lineChart,
      legends: ['Uptime'],
      dataList: [
        {'source': 'uptime', 'type': 'uptime', 'dataset': 'value'}
      ],
    }
  ];

  public cards: Array<any> = [];
  public notes: Array<any> = [];
  public noteStyle: any = {
    // 'width': '480px',
    'height': '400px',
    // 'margin': '50px auto' 
  };
  constructor(private rest: RestService, private ws: WebSocketService,
    protected systemGeneralService: SystemGeneralService, private dialog: DialogService,
    protected loader: AppLoaderService, protected erdService: ErdService) {
    rest.get('storage/volume/', {}).subscribe((res) => {
      res.data.forEach((vol) => {
        this.graphs.splice(0, 0, {
          title: vol.vol_name + " Volume Usage",
          type: LineChartService.pieChart,
          legends: ['Available', 'Used'],
          dataList: [],
          series: [['Available', vol.avail], ['Used', vol.used]]
        });
      });
    });
  }

   parseResponse(data){
    let key = _.keys(data);
    var card: NoteCard = {
      id:key[0],
      title:key[0].substring(5),
      content:data[key[0]],
      lazyLoaded: false,
      template:'none',
      isNew:false
    }
    return card;
  }

  ngOnInit() {
    this.ws.call('system.info').subscribe((res) => {
      this.info = res;
      this.info.loadavg =
        this.info.loadavg.map((x, i) => {return x.toFixed(2);}).join(' ');
      this.info.physmem =
        Number(this.info.physmem / 1024 / 1024).toFixed(0) + ' MiB';
    });
    this.ws.call('network.general.summary').subscribe((res) => {
      this.network_info = res;
    })
    this.systemGeneralService.getIPChoices().subscribe((res) => {
      if (res.length > 0) {
        this.ipAddress = _.uniq(res[0]);
      } else {
        this.ipAddress = res;
      }
    });
    this.ws.call('stats.get_sources').subscribe((res) => {
      let gLegends = [], gDataList = [];
      
      for (const prop in res) {
        if (prop.startsWith("disk-") && !prop.startsWith("disk-cd")) {
          gLegends.push(prop + " (read)");
          gLegends.push(prop + " (write)");
          gDataList.push({source: prop, type: 'disk_ops', dataset: 'read'});
          gDataList.push({source: prop, type: 'disk_ops', dataset: 'write'});
        }
      }
      this.graphs.push({
        title: "Disk IOPS",
        type: LineChartService.lineChart,
        legends: gLegends,
        dataList: gDataList
      });
     });

    this.getNotes();
  }

  getNotes() {
    // get notes
    this.rest.get("account/users/1", {}).subscribe((res) => {
      this.notes = [];
      for (let i in res.data.bsdusr_attributes) {
        if (_.startsWith(i, 'note_')) {
          this.notes.push(_.pick(res.data.bsdusr_attributes, i));
        }
      }
      for (let i = 0; i < this.notes.length; i++) {
        let card = this.parseResponse(this.notes[i]);
        this.cards.push(card);
      }
    });
  }

  ngAfterViewInit(): void {
    this.erdService.attachResizeEventToElement("dashboardcontainerdiv");
  }

  addNote() {
    let index = this.cards.length;
    let card: NoteCard = {
      id: "",
      title:"",
      content:"",
      lazyLoaded:false,
      template:'',
      cardActions:[],
      isNew:true,
    }
    this.cards.push(card);
    this.toggleForm(true,this.cards[index],'edit');
  }

  deleteNote(noteId) {
    this.dialog.confirm("Delete", "Are you sure you want to delete note " + noteId.substring(5) + "?").subscribe((res) => {
      if (res) {
        this.loader.open();
        this.notes.slice(_.findIndex(this.notes, noteId), 1);
        this.ws.call('user.pop_attribute', [1, noteId]).subscribe(
          (wsres)=> {
            this.loader.close();
            this.cards = [];
            this.getNotes();
          },
          (wsres)=> {
            this.loader.close();
            console.log('error');
          });
      }
    })
  }

  focusVM(index){
    for(var i = 0; i < this.cards.length; i++){
      if(i !== index && this.cards[i].isFlipped ){
        this.cards[i].isFlipped = false;
        this.cards[i].lazyLoaded = false;
        this.cards[i].template = 'none';
      }
    }
  }
  
  toggleForm(flipState, card, template, id?){
    // load #cardBack template with code here
    if (id) {
      card.id = id;
      card.title = id.substring(5);
      card.isNew = false;
    }
    card.template = template;
    card.isFlipped = flipState;
    card.lazyLoaded = !card.lazyLoaded;
    var index = this.cards.indexOf(card);
    this.focusVM(index);
  }

  cancel(index){
    let card = this.cards[index];
    if(card.isNew){
      this.cards.splice(index,1);
    } else {
      this.toggleForm(false,card,'none')
    }

  }

  getNote(index) {
    this.rest.get("account/users/1", {}).subscribe((res) => {
      for (let i in res.data.bsdusr_attributes) {
        if (i == index) {
          _.find(this.cards, {id: index})['content'] = res.data.bsdusr_attributes[i];
          this.notes.push(_.pick(res.data.bsdusr_attributes, i));
        }
      }
    });
  }

  refreshNote(id) {
    this.getNote(id);
  }
}
