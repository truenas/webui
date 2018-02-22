import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { WebSocketService } from '../../../services/ws.service';
import { AppLoaderService } from '../../../services/app-loader/app-loader.service';
import { TranslateService } from 'ng2-translate/ng2-translate';

@Component({
  selector: 'system-reboot',
  templateUrl: './reboot.component.html',
  styleUrls: ['./reboot.component.css']
})
export class RebootComponent implements OnInit {

  constructor(protected ws: WebSocketService, protected router: Router, 
    protected loader: AppLoaderService, public translate: TranslateService) {
    setTimeout(() => {
      this.isWSConnected();
    }, 1000);
  }

  isWSConnected() {
    if (this.ws.connected) {
      this.loader.close();
      // ws is connected
      this.router.navigate(['/session/signin']);
    } else {
      setTimeout(() => {
        this.isWSConnected();
      }, 5000);
    }
  }
  ngOnInit() {
    this.loader.open();
  }

}
