import { MdDialog, MdDialogRef} from '@angular/material';
import { Component, AfterViewChecked, ViewChild, ElementRef } from '@angular/core';
import {
  WebSocketService
} from '../../../services/';

@Component({
  selector: 'consolepanel-dialog',
  styleUrls: ['./consolepanel-dialog.component.scss'],
  templateUrl: './consolepanel-dialog.component.html'
})
export class ConsolePanelModalDialog {

  public intervalPing;
  public consoleMsg: String = "Loading...";
  @ViewChild('footerBarScroll') private footerBarScroll: ElementRef;

  constructor(
    public dialogRef: MdDialogRef<ConsolePanelModalDialog>,
    private ws: WebSocketService) { }

  ngOnInit() {
    this.getLogConsoleMsg();
  }

  ngAfterViewChecked() {
    this.scrollToBottomOnFooterBar();
  }

  scrollToBottomOnFooterBar(): void {
    try {
      this.footerBarScroll.nativeElement.scrollTop = this.footerBarScroll.nativeElement.scrollHeight;
    } catch(err) { }
  }

  getLogConsoleMsg() {
    let subName = "filesystem.file_tail_follow:/var/log/messages:500";

    this.intervalPing = setInterval( () => {
      this.ws.sub(subName).subscribe((res) => {
        this.consoleMsg = res.data;
        this.scrollToBottomOnFooterBar();
      });
    }, 2000);
  }

  onStopRefresh(data) {
    if(data.checked) {
      clearInterval(this.intervalPing);
    }
    else {
      this.getLogConsoleMsg();
    }    
  }

}
