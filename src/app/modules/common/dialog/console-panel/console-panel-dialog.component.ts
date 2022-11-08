import {
  ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ConsoleMessagesStore } from 'app/modules/layout/components/console-footer/console-messages.store';

@UntilDestroy()
@Component({
  templateUrl: './console-panel-dialog.component.html',
  styleUrls: ['./console-panel-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsolePanelDialogComponent implements OnInit {
  @ViewChild('messageContainer', { static: true }) messageContainer: ElementRef<HTMLElement>;

  lines$ = this.messagesStore.lines$;

  constructor(
    private messagesStore: ConsoleMessagesStore,
  ) {}

  get isScrolledToBottom(): boolean {
    const delta = 3;
    const nativeElement = this.messageContainer.nativeElement;
    return nativeElement.scrollHeight - nativeElement.scrollTop - nativeElement.clientHeight <= delta;
  }

  ngOnInit(): void {
    this.scrollToBottomOnNewMessages();
  }

  private scrollToBottomOnNewMessages(): void {
    this.lines$.pipe(untilDestroyed(this)).subscribe(() => {
      if (!this.isScrolledToBottom) {
        // User scrolled up, don't scroll down
        return;
      }

      this.scrollToBottom();
    });
  }

  private scrollToBottom(): void {
    const nativeElement = this.messageContainer.nativeElement;
    setTimeout(() => {
      nativeElement.scroll({ top: nativeElement.scrollHeight });
    });
  }
}
