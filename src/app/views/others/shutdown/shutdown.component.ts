import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { WebSocketService } from '../../../services/ws.service';
import { AppLoaderService } from '../../../services/app-loader/app-loader.service';
import { TranslateService } from '@ngx-translate/core';
import { DialogService } from '../../../services/dialog.service';
import globalHelptext from '../../../helptext/global-helptext';
import { LocaleService } from 'app/services/locale.service';

@Component({
  selector: 'system-shutdown',
  templateUrl: './shutdown.component.html',
  styleUrls: ['./shutdown.component.css'],
})
export class ShutdownComponent implements OnInit {
  product_type: string;
  copyrightYear = this.localeService.getCopyrightYearFromBuildTime();

  constructor(
    protected ws: WebSocketService,
    protected router: Router,
    protected loader: AppLoaderService,
    public translate: TranslateService,
    protected dialogService: DialogService,
    private localeService: LocaleService,
    private location: Location,
  ) {
    this.ws.call('system.product_type').subscribe((res) => {
      this.product_type = res;
    });
  }

  ngOnInit() {
    // Replace URL so that we don't shutdown again if page is refreshed.
    this.location.replaceState('/session/signin');

    this.ws.call('system.shutdown', {}).subscribe(
      (res) => {
      },
      (res) => { // error on shutdown
        this.dialogService.errorReport(res.error, res.reason, res.trace.formatted).subscribe((closed) => {
          this.router.navigate(['/session/signin']);
        });
      },
      () => {
        this.ws.prepare_shutdown();
      },
    );
    // fade to black after 60 sec on shut down
    setTimeout(() => {
      const overlay = document.getElementById('overlay');
      overlay.setAttribute('class', 'blackout');
    }, 60000);
  }
}
