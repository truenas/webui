import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, ElementRef, OnInit, Signal, viewChild,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialogContent, MatDialogActions, MatDialogClose } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { ConsoleMessagesStore } from 'app/modules/layout/console-footer/console-messages.store';
import { TestDirective } from 'app/modules/test-id/test.directive';

@UntilDestroy()
@Component({
  selector: 'ix-console-panel-dialog',
  templateUrl: './console-panel-dialog.component.html',
  styleUrls: ['./console-panel-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDialogContent,
    MatDialogActions,
    MatButton,
    MatDialogClose,
    AsyncPipe,
    TranslateModule,
    TestDirective,
  ],
})
export class ConsolePanelDialogComponent implements OnInit {
  private readonly messageContainer: Signal<ElementRef<HTMLElement>> = viewChild('messageContainer', { read: ElementRef });

  lines$ = this.messagesStore.lines$;

  constructor(
    private messagesStore: ConsoleMessagesStore,
  ) {}

  get isScrolledToBottom(): boolean {
    const delta = 3;
    const nativeElement = this.messageContainer().nativeElement;
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
    const nativeElement = this.messageContainer().nativeElement;
    setTimeout(() => {
      nativeElement.scroll({ top: nativeElement.scrollHeight });
    });
  }
}
