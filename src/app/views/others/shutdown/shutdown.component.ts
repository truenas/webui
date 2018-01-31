import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { WebSocketService } from '../../../services/ws.service';
import { AppLoaderService } from '../../../services/app-loader/app-loader.service';

@Component({
  selector: 'system-shutdown',
  templateUrl: './shutdown.component.html',
  styleUrls: ['./shutdown.component.css']
})
export class ShutdownComponent implements OnInit {

  constructor(protected ws: WebSocketService, protected router: Router, protected loader: AppLoaderService, ) {
  }

  ngOnInit() {
  }

}
