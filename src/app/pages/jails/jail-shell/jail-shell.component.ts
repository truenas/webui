import { Component, ElementRef, Input, /*OnChanges, OnDestroy,*/ AfterViewInit, /*SimpleChange, ViewChild*/ } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { CopyPasteMessageComponent } from 'app/pages/shell/copy-paste-message.component';
import { ShellComponent } from 'app/pages/shell/shell.component';
import helptext from '../../../helptext/vm/vm-cards/vm-cards';
import { ShellService, WebSocketService } from '../../../services/';
import * as _ from 'lodash';

@Component({
  selector: 'app-vmserial-shell',
  templateUrl: '../../shell/shell.component.html',
  styleUrls: ['../../shell/shell.component.css'],
  providers: [ShellService],
})

export class JailShellComponent extends ShellComponent implements AfterViewInit {
  protected pk: string;
  protected route_success: string[] = ['jails'];

  constructor(protected __ws: WebSocketService,
              protected __ss: ShellService,
              protected aroute: ActivatedRoute,
              protected __translate: TranslateService,
              protected router: Router,
              protected __snackbar: MatSnackBar) {
    super(__ws,__ss,__translate,__snackbar);
  }


  ngAfterViewInit() {
    this.aroute.params.subscribe(params => {
      this.pk = params['pk'];
      this.getAuthToken().subscribe((res) => {
        this.initializeWebShell(res);
        this.shellSubscription = this.ss.shellOutput.subscribe((value) => {
          if (value !== undefined) {
            this.xterm.write(value);

            if (_.trim(value) == "logout") {
              this.xterm.destroy();
              this.router.navigate(new Array('/').concat(this.route_success));
            }
          }
        });
        this.initializeTerminal();
      });
    });
  }

  initializeWebShell(res: string) {
    this.ss.token = res;
    this.ss.jailId = this.pk;
    this.ss.connect();
  }

}
