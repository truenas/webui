import {
  ChangeDetectionStrategy, Component, OnInit, ViewChild, inject, input, output, signal,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Tunable } from 'app/interfaces/tunable.interface';
import {
  FormDefinition,
} from 'app/modules/forms/ix-forms/components/ix-form-renderer/form-definition.interface';
import { IxFormRendererComponent } from 'app/modules/forms/ix-forms/components/ix-form-renderer/ix-form-renderer.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { getTunableFormConfig } from 'app/pages/system/advanced/tunable/tunable-form/tunable.form-config';

/**
 * Thin host for the declarative tunable (sysctl) form. Works in a legacy SlideIn
 * (`slideInRef`) or a `tn-side-panel` via `FormSidePanelService` (`tunable` input
 * + `closed` output + host-driven `submit()`); the fields/validators/submit live
 * in {@link getTunableFormConfig}.
 */
@Component({
  selector: 'ix-tunable-form',
  templateUrl: './tunable-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IxFormRendererComponent],
})
export class TunableFormComponent implements OnInit {
  private api = inject(ApiService);
  private translate = inject(TranslateService);

  /** Present via legacy SlideIn host; absent inside a `tn-side-panel`. */
  readonly slideInRef = inject<SlideInRef<Tunable | undefined, boolean>>(SlideInRef, { optional: true });

  /** Tunable to edit when hosted via FormSidePanelService (SlideIn passes it via `SlideInRef`). */
  readonly tunable = input<Tunable>();

  /** Emitted to a `tn-side-panel` host on a successful save (forwarded from the renderer). */
  readonly closed = output<boolean>();

  // Non-signal query (see group-form): a host mirrors `canSubmit` from the
  // renderer's `(canSubmitChange)` output into the signal below.
  @ViewChild(IxFormRendererComponent) private renderer?: IxFormRendererComponent;

  protected readonly canSubmitSig = signal(false);
  /** Host (`tn-side-panel` footer Save) reads this to enable/disable saving. */
  readonly canSubmit = this.canSubmitSig.asReadonly();

  protected editingTunable: Tunable | undefined;
  protected definition!: FormDefinition<Tunable>;

  ngOnInit(): void {
    this.editingTunable = this.slideInRef ? this.slideInRef.getData() : this.tunable();
    this.definition = getTunableFormConfig(this.api, this.translate, this.editingTunable);
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
