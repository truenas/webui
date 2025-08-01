import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, OnInit, Signal, viewChild, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ConsoleMessagesStore } from 'app/modules/layout/console-footer/console-messages.store';
import { ConsolePanelDialog } from 'app/modules/layout/console-footer/console-panel/console-panel-dialog.component';

@UntilDestroy()
@Component({
  selector: 'ix-console-footer',
  templateUrl: './console-footer.component.html',
  styleUrls: ['./console-footer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AsyncPipe],
})
export class ConsoleFooterComponent implements OnInit {
  private matDialog = inject(MatDialog);
  private messagesStore = inject(ConsoleMessagesStore);

  private readonly messageContainer: Signal<ElementRef<HTMLElement>> = viewChild.required('messageContainer', { read: ElementRef });

  lastThreeLogLines$ = this.messagesStore.lastThreeLogLines$;

  ngOnInit(): void {
    this.messagesStore.subscribeToMessageUpdates();
    this.scrollToBottomOnNewMessages();
  }

  onShowConsolePanel(): void {
    this.matDialog.open(ConsolePanelDialog);
  }

  private scrollToBottomOnNewMessages(): void {
    this.lastThreeLogLines$.pipe(untilDestroyed(this)).subscribe(() => {
      try {
        this.messageContainer().nativeElement.scroll({ top: this.messageContainer().nativeElement.scrollHeight });
      } catch {}
    });
  }
}
