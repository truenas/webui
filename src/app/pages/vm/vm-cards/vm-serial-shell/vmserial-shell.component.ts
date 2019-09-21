import { Component, ElementRef, Input, /*OnChanges, OnDestroy,*/ AfterViewInit, /*SimpleChange, ViewChild*/ } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { CopyPasteMessageComponent } from 'app/pages/shell/copy-paste-message.component';
import { ShellComponent } from 'app/pages/shell/shell.component';
import helptext from '../../../../helptext/vm/vm-cards/vm-cards';
import { ShellService, WebSocketService } from '../../../../services/';

@Component({
  selector: 'app-vmserial-shell',
  templateUrl: '../../../shell/shell.component.html',
  styleUrls: ['../../../shell/shell.component.css'],
  providers: [ShellService],
})

export class VMSerialShellComponent extends ShellComponent implements AfterViewInit {
  protected pk: string;

  constructor(protected __ws: WebSocketService,
              protected __ss: ShellService,
              protected aroute: ActivatedRoute,
              protected __translate: TranslateService,
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
            if(this.filteredValue(value)){ return; }
            this.xterm.write(value);
          }
        });
        this.initializeTerminal();
      });
    });

  }

  initializeTerminal() {

    this.xterm = new (<any>window).Terminal({
      'cursorBlink': true,
      'tabStopWidth': 8,
      'cols': this.cols,
      'rows': this.rows,
      'focus': true
    });

    this.xterm.open(this.container.nativeElement, true);
    this.xterm.attach(this.ss);
    this.xterm._initialized = true;
    this.fitTerm();
    this.rowCount = this.getRowCount();

    /*this.xterm.on('key', (e) => {
      if(e.key == "Enter"){
        this.resetScrollBottom();
      }
    });*/
    this.setupListeners();

    this.xterm.send('cu -l /dev/nmdm'+this.pk+'B\n');
    this.xterm.send('\r');
    this.forceDimensions();
  }

}
