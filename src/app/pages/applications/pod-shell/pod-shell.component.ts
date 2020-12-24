import { Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, SimpleChange, ViewChild,ViewEncapsulation } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { CopyPasteMessageComponent } from 'app/pages/shell/copy-paste-message.component';
import * as _ from 'lodash';
import { ShellService, WebSocketService } from '../../../services';
import helptext from "./../../../helptext/shell/shell";
import { Terminal } from 'xterm';
import { AttachAddon } from 'xterm-addon-attach';
import { FitAddon } from 'xterm-addon-fit';
import * as FontFaceObserver from 'fontfaceobserver';
import { CoreEvent, CoreService } from 'app/core/services/core.service';
import { Subject } from 'rxjs';
import { EntityToolbarComponent } from 'app/pages/common/entity/entity-toolbar/entity-toolbar.component';

@Component({
  selector: 'app-pod-shell',
  templateUrl: './pod-shell.component.html',
  styleUrls: ['./pod-shell.component.css'],
  providers: [ShellService],
  encapsulation: ViewEncapsulation.None,
})

export class PodShellComponent implements OnInit, OnChanges, OnDestroy {
  // sets the shell prompt
  @Input() prompt = '';
  //xter container
  @ViewChild('terminal', { static: true}) container: ElementRef;
  // xterm variables
  cols: string;
  rows: string;
  font_size = 14;
  font_name = 'Inconsolata';
  public token: any;
  public xterm: any;
  public resize_terminal = true;
  private shellSubscription: any;
  private fitAddon: any;
  public formEvents: Subject<CoreEvent>;

  public usage_tooltip = helptext.usage_tooltip;

  clearLine = "\u001b[2K\r"
  public shellConnected: boolean = false;
  public connectionId: string;
  protected rname: string;
  protected pname: string;
  protected cname: string;
  protected route_success: string[] = ['apps'];

  constructor(protected core:CoreService,
    private ws: WebSocketService,
    public ss: ShellService,
    public translate: TranslateService,
    protected aroute: ActivatedRoute,
    protected router: Router,
    private dialog: MatDialog) {
  }

  ngOnInit() {
    this.aroute.params.subscribe(params => {
      this.rname = params['rname'];
      this.pname = params['pname'];
      this.cname = params['cname'];
      console.log(this.rname, this.pname, this.cname);

      this.getAuthToken().subscribe((res) => {
        this.initializeWebShell(res);
        this.shellSubscription = this.ss.shellOutput.subscribe((value) => {
          if (value !== undefined) {
            // this.xterm.write(value);

            if (_.trim(value) == "logout") {
              this.xterm.destroy();
              this.router.navigate(new Array('/').concat(this.route_success));
            }
          }
        });
        this.initializeTerminal();
      });
    });

    // this.getAuthToken().subscribe((res) => {
    //   this.initializeWebShell(res);
    //   this.shellSubscription = this.ss.shellOutput.subscribe((value) => {
    //   });
    //   this.initializeTerminal();
    // });
  }

  ngOnDestroy() {
    if (this.ss.connected){
      this.ss.socket.close();
    }
    if(this.shellSubscription){
      this.shellSubscription.unsubscribe();
    }
  }
  
  refreshToolbarButtons() {
    this.formEvents = new Subject();
    this.formEvents.subscribe((evt: CoreEvent) => {
      if (evt.data.event_control == 'restore') {
        this.resetDefault();
        this.refreshToolbarButtons();
      } else if (evt.data.event_control == 'reconnect') {
        this.reconnect();
        this.refreshToolbarButtons();
      } else if (evt.data.event_control == 'fontsize') {
        this.font_size = evt.data.fontsize;
        this.resizeTerm();
      }
    });

    let controls = [];
    if (this.shellConnected) {
      controls = [
        {
          name: 'fontsize',
          label: 'Set font size',
          type: 'slider',
          min: 10,
          max: 20, 
          step: 1,
          value: this.font_size,
        },
        {
          name: 'restore',
          label: 'Restore default',
          type: 'button',
          color: 'primary',
        },
      ];
    } else {
      controls = [
        {
          name: 'reconnect',
          label: 'Reconnect',
          type: 'button',
          color: 'primary',
        },
      ];
    }
    // Setup Global Actions
    const actionsConfig = {
      actionType: EntityToolbarComponent,
      actionConfig: {
        target: this.formEvents,
        controls: controls,
      }
    };

    this.core.emit({name:"GlobalActions", data: actionsConfig, sender: this});
  }

  onResize(event) {
    this.resizeTerm();
  }

  onFontSizeChanged(event) {
    this.resizeTerm();
  }

  resetDefault() {
    this.font_size = 14;
    this.resizeTerm();
  }

  ngOnChanges(changes: {
    [propKey: string]: SimpleChange
  }) {
    const log: string[] = [];
    for (const propName in changes) {
      const changedProp = changes[propName];
      // reprint prompt
      if (propName === 'prompt' && this.xterm != null) {
        // this.xterm.write(this.clearLine + this.prompt)
      }
    }
  }

  onRightClick(): false {
    this.dialog.open(CopyPasteMessageComponent);
    return false;
  }

  initializeTerminal() {
    
    const size = this.getSize();

    const setting = {
      cursorBlink: false,
      tabStopWidth: 8,
      cols: size.cols,
      rows: size.rows,
      focus: true,
      fontSize: this.font_size,
      fontFamily: this.font_name,
      allowTransparency: true
    };

    this.xterm = new Terminal(setting);
    
    const attachAddon = new AttachAddon(this.ss.socket);
    this.xterm.loadAddon(attachAddon);

    this.fitAddon = new FitAddon();
    this.xterm.loadAddon(this.fitAddon);

    var font = new FontFaceObserver(this.font_name);
    
    font.load().then((e) => {
      this.xterm.open(this.container.nativeElement);
      this.fitAddon.fit();
      this.xterm._initialized = true;
    }, function (e) {
      console.log('Font is not available', e);
    });    
    
  }

  getSize() {
    const domWidth = this.container.nativeElement.offsetWidth;
    const domHeight = this.container.nativeElement.offsetHeight;
    var span = document.createElement('span');
    this.container.nativeElement.appendChild(span);
    span.style.whiteSpace = 'nowrap';
    span.style.fontFamily = this.font_name;
    span.style.fontSize = this.font_size + 'px';
    span.innerHTML = 'a';

    let cols = 0;
    while(span.offsetWidth < domWidth) {      
      span.innerHTML += 'a';
      cols++;
    }

    let rows = Math.ceil(domHeight / span.offsetHeight);
    span.remove();
    if (cols < 80) {
      cols = 80;
    }
    
    if (rows < 10) {
      rows = 10;
    }

    return {
      rows: rows,
      cols: cols
    }
  }

  resizeTerm(){
    const size = this.getSize();
    this.xterm.setOption('fontSize', this.font_size);
    this.fitAddon.fit();
    this.ws.call('core.resize_shell', [this.connectionId, size.cols, size.rows]).subscribe((res)=> {
    });
    return true;
  }

  initializeWebShell(res: string) {
    this.ss.token = res;
    this.ss.connect();
    this.ss.podInfo = {
      pname: this.pname,
      rname: this.rname,
      cname: this.cname
    };

    this.refreshToolbarButtons();  

    this.ss.shellConnected.subscribe((res)=> {
      this.shellConnected = res.connected;
      this.connectionId = res.id;
      
      this.refreshToolbarButtons();      
      this.resizeTerm();
    })
  }

  getAuthToken() {
    return this.ws.call('auth.generate_token');
  }

  reconnect() {
    this.ss.connect();
  }
}
