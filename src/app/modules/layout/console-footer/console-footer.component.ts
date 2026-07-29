import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, OnInit, Signal, viewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TnDialog } from '@truenas/ui-components';
import { ConsoleMessagesStore } from 'app/modules/layout/console-footer/console-messages.store';
import { ConsolePanelDialog } from 'app/modules/layout/console-footer/console-panel/console-panel-dialog.component';

@Component({
  selector: 'ix-console-footer',
  templateUrl: './console-footer.component.html',
  styleUrls: ['./console-footer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AsyncPipe],
})
export class ConsoleFooterComponent implements OnInit {
  private tnDialog = inject(TnDialog);
  private messagesStore = inject(ConsoleMessagesStore);
  private destroyRef = inject(DestroyRef);

  private readonly messageContainer: Signal<ElementRef<HTMLElement>> = viewChild.required('messageContainer', { read: ElementRef });

  lastThreeLogLines$ = this.messagesStore.lastThreeLogLines$;

  ngOnInit(): void {
    this.messagesStore.subscribeToMessageUpdates();
    this.scrollToBottomOnNewMessages();
  }

  onShowConsolePanel(): void {
    this.tnDialog.open(ConsolePanelDialog);
  }

  private scrollToBottomOnNewMessages(): void {
    this.lastThreeLogLines$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      try {
        this.messageContainer().nativeElement.scroll({ top: this.messageContainer().nativeElement.scrollHeight });
      } catch {}
    });
  }
}
