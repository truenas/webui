import { Component, OnChanges, ElementRef, OnInit, AfterViewInit, ViewChild, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Observable } from 'rxjs/Observable';
import { BrowserModule } from '@angular/platform-browser';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { RestService, WebSocketService } from '../../services/';
import { MaterialModule } from '../../appMaterial.module';
import { MatButtonToggleGroup } from '@angular/material/button-toggle';

@Component({
  selector: 'services-table',
  templateUrl: './services-table.component.html',
  styleUrls: ['./services-table.component.css']
})
export class ServicesTableComponent implements OnChanges {

  @Input() conf: any;
  @Input() data: any[];

  public columns: Array < any > = [
    { name: 'State', prop: 'state' },
    { name: 'Label', prop: 'label' },
    { name: 'Enable', prop: 'enable' },
    { name: 'Actions', prop: 'cardActions' }
  ];

  constructor(protected router: Router, protected rest: RestService, protected ws: WebSocketService) {}

  ngOnChanges() {

  }

}
