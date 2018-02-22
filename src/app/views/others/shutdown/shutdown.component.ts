import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { WebSocketService } from '../../../services/ws.service';
import { AppLoaderService } from '../../../services/app-loader/app-loader.service';
import { TranslateService } from 'ng2-translate/ng2-translate';

@Component({
  selector: 'system-shutdown',
  templateUrl: './shutdown.component.html',
  styleUrls: ['./shutdown.component.css']
})
export class ShutdownComponent implements OnInit {

  constructor(protected ws: WebSocketService, protected router: Router, 
    protected loader: AppLoaderService, public translate: TranslateService) {
  }

  ngOnInit() {
  }

}
