import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { WebSocketService } from '../../../services/ws.service';
import { AppLoaderService } from '../../../services/app-loader/app-loader.service';
import { TranslateService } from '@ngx-translate/core';
import { DialogService } from '../../../services/dialog.service';
import globalHelptext from '../../../helptext/global-helptext';

@Component({
  selector: 'system-shutdown',
  templateUrl: './shutdown.component.html',
  styleUrls: ['./shutdown.component.css']
})
export class ShutdownComponent implements OnInit {    
  
  public product_type: string;
  public copyrightYear = globalHelptext.copyright_year;

  constructor(protected ws: WebSocketService, protected router: Router, 
    protected loader: AppLoaderService, public translate: TranslateService,
    protected dialogService: DialogService) {
      this.ws = ws;
      this.ws.call('system.product_type').subscribe((res)=>{
        this.product_type = res;
      });
  }

  ngOnInit() {
    this.ws.call('system.shutdown', {}).subscribe(
      (res) => {
      },
      (res) => { // error on shutdown
        this.dialogService.errorReport(res.error, res.reason, res.trace.formatted).subscribe(closed => {
          this.router.navigate(['/session/signin']);
        });
      },
      () => {
        this.ws.prepare_shutdown();
      });
      // fade to black after 60 sec on shut down
      setTimeout(() => {
        let overlay = document.getElementById('overlay');
        overlay.setAttribute('class', 'blackout');

      }, 60000);
  }
}
