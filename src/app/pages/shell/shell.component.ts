import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  OnChanges,
  Input,
  Output,
  EventEmitter,
  SimpleChange
} from '@angular/core';
import { Subscription } from 'rxjs';

import { WebSocketService, ShellService } from '../../services/';
import * as xterm from "xterm";
import * as Terminal from 'xterm/dist/xterm';
import 'xterm/dist/addons/fit/fit.js';
import 'xterm/dist/addons/attach/attach.js';

@Component({
  selector: 'app-shell',
  templateUrl: './shell.component.html',
  providers: [ShellService],
})

export class ShellComponent implements OnInit, OnChanges {
  // This Xterm implementation emits all commands, once the users presses 'Enter'
  @Output() stdin: EventEmitter < string > = new EventEmitter < string > ();
  // waits for events that should be printed on the terminal
  @Input() stdout: EventEmitter < string > ;
  // sets the shell prompt
  @Input() prompt: string = '';
  //xter container
  @ViewChild('terminal') container: ElementRef;

  // handle up/down command history functionality
  history: any = [];
  historyIndex: number;
  last: number;

  // caches stdin, until the user presses Enter
  buffer: string = '';

  // xterm variables
  terminalContainer: any;
  term: any;
  optionElements: any;
  cols: string;
  rows: string;
  public token: any;
  public xterm: any;

  clearLine = "\u001b[2K\r"

  ngOnInit() {
    this.initializeTerminal();
    this.initializeWebShell();
    // disabled from demo code
    // this.xterm.on('key', (key, ev) => {
    //   this.xterm.write(key);
    // });
  }

  ngOnChanges(changes: {
    [propKey: string]: SimpleChange
  }) {
    let log: string[] = [];
    for (let propName in changes) {
      let changedProp = changes[propName];
      // reprint prompt
      if (propName == 'prompt' && this.xterm != null) {
        this.xterm.write(this.clearLine + this.prompt)
      }
    }
  }

  initializeTerminal() {
    this.xterm = new Terminal({
      'cursorBlink': true,
      'tabStopWidth': 4,
      'cols': 80,
      'rows': 50,
      'focus': true
    });
    this.xterm.open(this.container.nativeElement);
    this.xterm.writeln('Welcome to Xin-xterm.js');
    this.xterm.attach(this.ss);
    this.xterm._initialized = true;

    // start registering the event listener, only need to be done the first time
    this.writePrompt();
    let self = this;
    // raw data
    this.xterm.on('data', function(data) {
      self.writeBuffer(data)
    });
  }

  // writes the command prompt, a prompt is not part of the input buffer
  writePrompt() {
    this.xterm.write(this.prompt);
  }

  // this writes the raw buffer and includes invisible charaters
  writeBuffer(data) {
    this.xterm.write(data);
    this.buffer += data;
  }

  // reset the command buffer
  resetBuffer() {
    this.buffer = '';
  }

  // stores a command in commmand history
  storeInHistory(cmd) {
    // remove cariage returns from history commands
    cmd = cmd.replace(/\r/, '');
    this.history.push(cmd);
    this.historyIndex = this.history.length;
  }

  // prints the current selected command at history index
  historyCmdtoStdout() {
    this.buffer = this.history[this.historyIndex];
    this.reprintCommand(this.buffer);
  }

  initializeWebShell() {
    this.ws.call('auth.generate_token').subscribe((res) => {
      this.ss.token = res;
      this.ss.connect();
    });
  }

  // resets the terminal
  clear() {
    this.xterm.reset();
    this.writePrompt();
  }

  // reprint a command in the current line
  reprintCommand(cmd) {
    // strip out any extra \r characters
    cmd = cmd.replace(/\r/g, '');
    this.xterm.write(this.clearLine + this.prompt + cmd);
  }

  keydown(ev) {
    let self = this
    if (ev.keyCode === 13) {
      let cmd = self.buffer
      // special handling for clear and cls
      if (/^\s*clear|cls\s*/.exec(cmd) != null) {
        // reset terminal
        setTimeout(function() {
          self.clear()
        }, 0);
      } else {
        // decouple from event loop, write a new line
        setTimeout(function() {
          self.xterm.writeln('')
          self.stdin.emit(cmd);
          self.storeInHistory(cmd)
        }, 0);
      }
      // reset index to last item +1
      self.resetBuffer()
    }
    // on backspace, pop characters from buffer
    else if (ev.keyCode == 8) {
      self.buffer = self.buffer.substr(0, self.buffer.length - 1);
      setTimeout(function() {
        self.reprintCommand(self.buffer)
      }, 0);
    }
    // press the up key, find previous item in cmd history
    else if (ev.keyCode === 40) {
      setTimeout(function() {
        if (self.historyIndex < self.history.length - 1) {
          self.historyIndex += 1
          self.historyCmdtoStdout()
        }
      }, 0);

    }
    // press the down key, find next item in cmd history
    else if (ev.keyCode === 38) {
      setTimeout(function() {
        if (self.historyIndex >= 1) {
          self.historyIndex -= 1
          self.historyCmdtoStdout()
        }
      }, 0);
    }
    // this forces xterm not to handle the key events with its own event handler
    return false;
  }

  constructor(private ws: WebSocketService, public ss: ShellService) {}
}
