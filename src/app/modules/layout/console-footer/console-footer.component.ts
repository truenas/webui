import {
  afterRenderEffect, ChangeDetectionStrategy, Component, ElementRef, OnInit, inject, viewChild,
} from '@angular/core';
import { TnDialog, TnTestIdDirective } from '@truenas/ui-components';
import { ConsoleMessagesStore } from 'app/modules/layout/console-footer/console-messages.store';
import { ConsolePanelDialog } from 'app/modules/layout/console-footer/console-panel/console-panel-dialog.component';

@Component({
  selector: 'ix-console-footer',
  templateUrl: './console-footer.component.html',
  styleUrls: ['./console-footer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TnTestIdDirective],
})
export class ConsoleFooterComponent implements OnInit {
  private tnDialog = inject(TnDialog);
  private messagesStore = inject(ConsoleMessagesStore);

  private readonly messageContainer = viewChild.required('messageContainer', { read: ElementRef<HTMLElement> });

  protected readonly lastThreeLogLines = this.messagesStore.lastThreeLogLines;

  constructor() {
    // Runs after the new lines are in the DOM, so scrollHeight already includes them.
    afterRenderEffect({
      write: () => {
        this.lastThreeLogLines();
        const element = this.messageContainer().nativeElement;
        element.scrollTop = element.scrollHeight;
      },
    });
  }

  ngOnInit(): void {
    this.messagesStore.subscribeToMessageUpdates();
  }

  protected onShowConsolePanel(): void {
    this.tnDialog.open(ConsolePanelDialog);
  }
}
