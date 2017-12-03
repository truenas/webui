import { Component, OnInit } from '@angular/core';
import { WebSocketService } from "../../../../../services/ws.service";
import { ActivatedRoute, Params } from "@angular/router";
import { RestService } from "../../../../../services/rest.service";

@Component({
  selector: 'app-disk-wipe',
  templateUrl: './disk-wipe.component.html',
  styleUrls: ['./disk-wipe.component.css']
})
export class DiskWipeComponent implements OnInit {

  constructor(private ws: WebSocketService,
              private activatedRoute: ActivatedRoute) {
  }

  ngOnInit() {
  }

}
