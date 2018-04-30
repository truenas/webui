import { MatDialog, MatDialogRef } from '@angular/material';
import { Component, AfterViewChecked, ViewChild, ElementRef, EventEmitter } from '@angular/core';
import { WebSocketService } from '../../../../services/';

@Component({
  selector: 'consolepanel-dialog',
  styleUrls: ['./consolepanel-dialog.component.scss'],
  templateUrl: './consolepanel-dialog.component.html'
})
export class ConsolePanelModalDialog {
  
  public refreshMsg: String = "Check to stop refresh";
  public intervalPing;
  public consoleMsg: String = "Loading...";
  @ViewChild('footerBarScroll') private footerBarScroll: ElementRef;
  onEventEmitter = new EventEmitter();

  constructor(
    public dialogRef: MatDialogRef<ConsolePanelModalDialog>,
    private ws: WebSocketService) { }

  ngOnInit() {
    this.getLogConsoleMsg();
  }

  ngAfterViewChecked() {
  }

  scrollToBottomOnFooterBar(): void {
    try {
      this.footerBarScroll.nativeElement.scrollTop = this.footerBarScroll.nativeElement.scrollHeight;
    } catch(err) { }
  }

  getLogConsoleMsg() {
    this.intervalPing = setInterval( () => {
      let isScrollBottom = false;
      let delta = 3;
      
      if(this.footerBarScroll.nativeElement.scrollTop + this.footerBarScroll.nativeElement.offsetHeight + delta >= this.footerBarScroll.nativeElement.scrollHeight) {
        isScrollBottom = true;
      }
      this.onEventEmitter.emit();
      if(isScrollBottom) {
        let timeout = setTimeout(() => {  
          this.scrollToBottomOnFooterBar();
          clearTimeout(timeout);
        }, 500);
      }
    }, 1000); 
    
    // First, will load once.
    let timeout = setTimeout(() => {  
      this.scrollToBottomOnFooterBar();
      clearTimeout(timeout);
    }, 1500);   
  }

  onStopRefresh(data) {
    if(data.checked) {
      clearInterval(this.intervalPing);
      this.refreshMsg = 'Uncheck to restart refresh';
    }
    else {
      this.getLogConsoleMsg();
      this.refreshMsg = "Check to stop refresh";
    }    
  }
}
