import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ShellService, WebSocketService } from '../../services/';
import { CopyPasteMessageComponent } from '../shell/copy-paste-message.component';

@Component({
  selector: 'app-system-processes',
  templateUrl: './system-processes.component.html',
  providers: [ShellService],
})

export class SystemProcessesComponent implements OnInit, OnDestroy {

  //xter container
  @ViewChild('terminal', { static: true}) container: ElementRef;

  // xterm variables
  public token: any;
  public xterm: any;
  private shellSubscription: any;
  private top_displayed = false;

  clearLine = "\u001b[2K\r"

  ngOnInit() {
    const self = this;
    this.getAuthToken().subscribe((res) => {
      this.initializeWebShell(res);
      this.shellSubscription = this.ss.shellOutput.subscribe((value) => {
        this.xterm.write(value);
        if (!this.top_displayed) {
          setTimeout(function() {
            self.xterm.send('top\n');
            setTimeout(function() {
              self.xterm.setOption('disableStdin', true);
            }, 100);
          }, 1000);
          this.top_displayed = true;
        }
      });
      this.initializeTerminal().then((res) => {
        if (res) {
          // excute 'top' command
         
        }
      });
    });
  }

  ngOnDestroy() {
    if (this.shellSubscription) {
      this.shellSubscription.unsubscribe();
    }
    if (this.ss.connected){
      this.ss.socket.close();
    }
  };

  initializeTerminal() {
    return new Promise((resolve, reject) => {
      this.xterm = new (<any>window).Terminal({ 
        //'cursorBlink': true,
        //'tabStopWidth': 4,
        'cols': 80,
        'rows': 25,
        'focus': false, 
      });
      this.xterm.open(this.container.nativeElement);
      this.xterm.attach(this.ss);
      this.xterm._initialized = true;
      resolve(this.xterm._initialized);
    });
  }

  initializeWebShell(res: string) {
    this.ss.token = res;
    this.ss.connect();
  }

  getAuthToken() {
    return this.ws.call('auth.generate_token');
  }

  onShellRightClick(): false {
    this.dialog.open(CopyPasteMessageComponent);
    return false;
  }

  constructor(private ws: WebSocketService, public ss: ShellService, private dialog: MatDialog) {
  }
}
