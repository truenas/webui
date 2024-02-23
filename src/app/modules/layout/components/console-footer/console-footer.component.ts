import {
  ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ConsoleMessagesStore } from 'app/modules/layout/components/console-footer/console-messages.store';
import { ConsolePanelDialogComponent } from 'app/modules/layout/components/console-footer/console-panel/console-panel-dialog.component';

@UntilDestroy()
@Component({
  selector: 'ix-console-footer',
  templateUrl: './console-footer.component.html',
  styleUrls: ['./console-footer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConsoleFooterComponent implements OnInit {
  @ViewChild('messageContainer', { static: true }) private messageContainer: ElementRef<HTMLElement>;

  lastThreeLogLines$ = this.messagesStore.lastThreeLogLines$;

  constructor(
    private matDialog: MatDialog,
    private messagesStore: ConsoleMessagesStore,
  ) { }

  ngOnInit(): void {
    this.messagesStore.subscribeToMessageUpdates();
    this.scrollToBottomOnNewMessages();
  }

  onShowConsolePanel(): void {
    this.matDialog.open(ConsolePanelDialogComponent);
  }

  private scrollToBottomOnNewMessages(): void {
    this.lastThreeLogLines$.pipe(untilDestroyed(this)).subscribe(() => {
      try {
        this.messageContainer.nativeElement.scroll({ top: this.messageContainer.nativeElement.scrollHeight });
      } catch (err: unknown) {}
    });
  }
}
