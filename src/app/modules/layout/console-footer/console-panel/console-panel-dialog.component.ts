import { DialogRef } from '@angular/cdk/dialog';
import {
  afterRenderEffect, ChangeDetectionStrategy, Component, ElementRef, inject, viewChild,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TnButtonComponent, TnDialogShellComponent } from '@truenas/ui-components';
import { ConsoleMessagesStore } from 'app/modules/layout/console-footer/console-messages.store';

/** How far from the bottom, in pixels, still counts as being at the bottom. */
const bottomTolerance = 3;

@Component({
  selector: 'ix-console-panel-dialog',
  templateUrl: './console-panel-dialog.component.html',
  styleUrls: ['./console-panel-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnDialogShellComponent,
    TnButtonComponent,
    TranslateModule,
  ],
})
export class ConsolePanelDialog {
  protected dialogRef = inject<DialogRef<boolean, ConsolePanelDialog>>(DialogRef);
  private messagesStore = inject(ConsoleMessagesStore);

  private readonly messageContainer = viewChild.required('messageContainer', { read: ElementRef<HTMLElement> });

  protected readonly lines = this.messagesStore.lines;

  /**
   * Whether new lines should keep the view pinned to the bottom. Tracked from scroll events rather than measured
   * when lines arrive, because by the time the view can be scrolled the new lines have already grown it.
   */
  private followsNewLines = true;

  constructor() {
    afterRenderEffect({
      write: () => {
        this.lines();
        if (this.followsNewLines) {
          const element = this.messageContainer().nativeElement;
          element.scrollTop = element.scrollHeight;
        }
      },
    });
  }

  protected onScroll(): void {
    const element = this.messageContainer().nativeElement;
    this.followsNewLines = element.scrollHeight - element.scrollTop - element.clientHeight <= bottomTolerance;
  }
}
