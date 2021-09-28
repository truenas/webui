import {
  Component, ViewChild, ElementRef, EventEmitter, OnInit,
} from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox/checkbox';
import { MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { Interval } from 'app/interfaces/timeout.interface';

@Component({
  selector: 'consolepanel-dialog',
  styleUrls: ['./console-panel-dialog.component.scss'],
  templateUrl: './console-panel-dialog.component.html',
})
export class ConsolePanelDialogComponent implements OnInit {
  refreshMsg = this.translate.instant('Check to stop refresh');
  intervalPing: Interval;
  consoleMsg = this.translate.instant('Loading...');
  @ViewChild('footerBarScroll', { static: true }) private footerBarScroll: ElementRef;
  onEventEmitter = new EventEmitter();

  constructor(
    protected translate: TranslateService,
    public dialogRef: MatDialogRef<ConsolePanelDialogComponent>,
  ) { }

  ngOnInit(): void {
    this.getLogConsoleMsg();
  }

  scrollToBottomOnFooterBar(): void {
    try {
      this.footerBarScroll.nativeElement.scrollTop = this.footerBarScroll.nativeElement.scrollHeight;
    } catch (err: unknown) { }
  }

  getLogConsoleMsg(): void {
    this.intervalPing = setInterval(() => {
      let isScrollBottom = false;
      const delta = 3;

      const nativeElement = this.footerBarScroll.nativeElement;
      if (nativeElement.scrollTop + nativeElement.offsetHeight + delta >= nativeElement.scrollHeight) {
        isScrollBottom = true;
      }
      this.onEventEmitter.emit();
      if (isScrollBottom) {
        const timeout = setTimeout(() => {
          this.scrollToBottomOnFooterBar();
          clearTimeout(timeout);
        }, 500);
      }
    }, 1000);

    // First, will load once.
    const timeout = setTimeout(() => {
      this.scrollToBottomOnFooterBar();
      clearTimeout(timeout);
    }, 1500);
  }

  onStopRefresh(data: MatCheckboxChange): void {
    if (data.checked) {
      clearInterval(this.intervalPing);
      this.refreshMsg = this.translate.instant('Uncheck to restart refresh');
    } else {
      this.getLogConsoleMsg();
      this.refreshMsg = this.translate.instant('Check to stop refresh');
    }
  }
}
