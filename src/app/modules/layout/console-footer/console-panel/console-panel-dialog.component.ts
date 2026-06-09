import { DialogRef } from '@angular/cdk/dialog';
import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, OnInit, Signal, viewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import { TnButtonComponent, TnDialogShellComponent } from '@truenas/ui-components';
import { ConsoleMessagesStore } from 'app/modules/layout/console-footer/console-messages.store';

@Component({
  selector: 'ix-console-panel-dialog',
  templateUrl: './console-panel-dialog.component.html',
  styleUrls: ['./console-panel-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnDialogShellComponent,
    TnButtonComponent,
    AsyncPipe,
    TranslateModule,
  ],
})
export class ConsolePanelDialog implements OnInit {
  protected dialogRef = inject<DialogRef<boolean, ConsolePanelDialog>>(DialogRef);
  private messagesStore = inject(ConsoleMessagesStore);
  private destroyRef = inject(DestroyRef);

  private readonly messageContainer: Signal<ElementRef<HTMLElement>> = viewChild.required('messageContainer', { read: ElementRef });

  lines$ = this.messagesStore.lines$;

  get isScrolledToBottom(): boolean {
    const delta = 3;
    const nativeElement = this.messageContainer().nativeElement;
    return nativeElement.scrollHeight - nativeElement.scrollTop - nativeElement.clientHeight <= delta;
  }

  ngOnInit(): void {
    this.scrollToBottomOnNewMessages();
  }

  private scrollToBottomOnNewMessages(): void {
    this.lines$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
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
