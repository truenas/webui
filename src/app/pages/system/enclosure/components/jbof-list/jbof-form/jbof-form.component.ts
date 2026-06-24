import {
  ChangeDetectionStrategy, Component, OnInit, ViewChild, inject, input, output, signal,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Jbof } from 'app/interfaces/jbof.interface';
import {
  FormDefinition,
} from 'app/modules/forms/ix-forms/components/ix-form-renderer/form-definition.interface';
import { IxFormRendererComponent } from 'app/modules/forms/ix-forms/components/ix-form-renderer/ix-form-renderer.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { getJbofFormConfig } from 'app/pages/system/enclosure/components/jbof-list/jbof-form/jbof.form-config';

/**
 * Thin host for the declarative JBOF form. Works in a legacy SlideIn
 * (`slideInRef`) or a `tn-side-panel` via `FormSidePanelService` (`jbof` input
 * + `closed` output + host-driven `submit()`); the fields/validators/submit live
 * in {@link getJbofFormConfig}.
 */
@Component({
  selector: 'ix-jbof-form',
  templateUrl: './jbof-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IxFormRendererComponent],
})
export class JbofFormComponent implements OnInit {
  private api = inject(ApiService);
  private translate = inject(TranslateService);

  /** Present via legacy SlideIn host; absent inside a `tn-side-panel`. */
  readonly slideInRef = inject<SlideInRef<Jbof | undefined, boolean>>(SlideInRef, { optional: true });

  /** JBOF to edit when hosted via FormSidePanelService (SlideIn passes it via `SlideInRef`). */
  readonly jbof = input<Jbof>();

  /** Emitted to a `tn-side-panel` host on a successful save (forwarded from the renderer). */
  readonly closed = output<boolean>();

  // Non-signal query (see group-form): a host mirrors `canSubmit` from the
  // renderer's `(canSubmitChange)` output into the signal below.
  @ViewChild(IxFormRendererComponent) private renderer?: IxFormRendererComponent;

  protected readonly canSubmitSig = signal(false);
  /** Host (`tn-side-panel` footer Save) reads this to enable/disable saving. */
  readonly canSubmit = this.canSubmitSig.asReadonly();

  protected editingJbof: Jbof | undefined;
  protected definition!: FormDefinition<Jbof>;

  ngOnInit(): void {
    this.editingJbof = this.slideInRef ? this.slideInRef.getData() : this.jbof();
    this.definition = getJbofFormConfig(this.api, this.translate, this.editingJbof);
  }

  /** Host-driven submit (`tn-side-panel` footer Save) → run the renderer. */
  submit(): void {
    this.renderer?.submit();
  }

  /** Host hook (`tn-side-panel` closeGuard) to confirm before discarding edits. */
  hasUnsavedChanges(): boolean {
    return this.renderer?.hasUnsavedChanges() ?? false;
  }
}
