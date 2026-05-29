import { Signal, TemplateRef } from '@angular/core';

/**
 * Implemented by every feedback form rendered inside FeedbackDialog.
 * A form exposes the action buttons it wants projected into the dialog shell
 * footer via `dialogActions`. The dialog queries this single token rather than
 * each concrete form type, so adding a new form only requires providing it.
 */
export abstract class FeedbackForm {
  abstract readonly dialogActions: Signal<TemplateRef<unknown> | undefined>;
}
