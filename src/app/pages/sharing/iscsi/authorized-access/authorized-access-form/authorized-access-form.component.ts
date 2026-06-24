import {
  ChangeDetectionStrategy, Component, OnInit, ViewChild, inject, input, output, signal,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { IscsiAuthAccess } from 'app/interfaces/iscsi.interface';
import {
  FormDefinition,
} from 'app/modules/forms/ix-forms/components/ix-form-renderer/form-definition.interface';
import { IxFormRendererComponent } from 'app/modules/forms/ix-forms/components/ix-form-renderer/ix-form-renderer.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  AuthorizedAccessFormValues,
  getAuthorizedAccessFormConfig,
} from 'app/pages/sharing/iscsi/authorized-access/authorized-access-form/authorized-access.form-config';

/**
 * Thin host for the declarative authorized-access form. Works in a legacy SlideIn
 * (`slideInRef`) or a `tn-side-panel` via `FormSidePanelService` (`access` input
 * + `closed` output + host-driven `submit()`); the fields/validators/submit live
 * in {@link getAuthorizedAccessFormConfig}.
 */
@Component({
  selector: 'ix-authorized-access-form',
  templateUrl: './authorized-access-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IxFormRendererComponent],
})
export class AuthorizedAccessFormComponent implements OnInit {
  private api = inject(ApiService);
  private translate = inject(TranslateService);

  /** Present via legacy SlideIn host; absent inside a `tn-side-panel`. */
  readonly slideInRef = inject<SlideInRef<IscsiAuthAccess | undefined, boolean>>(SlideInRef, { optional: true });

  /** Access to edit when hosted via FormSidePanelService (SlideIn passes it via `SlideInRef`). */
  readonly access = input<IscsiAuthAccess>();

  /** Emitted to a `tn-side-panel` host on a successful save (forwarded from the renderer). */
  readonly closed = output<boolean>();

  // Non-signal query (see group-form): a host mirrors `canSubmit` from the
  // renderer's `(canSubmitChange)` output into the signal below.
  @ViewChild(IxFormRendererComponent) private renderer?: IxFormRendererComponent;

  protected readonly canSubmitSig = signal(false);
  /** Host (`tn-side-panel` footer Save) reads this to enable/disable saving. */
  readonly canSubmit = this.canSubmitSig.asReadonly();

  protected editingAccess: IscsiAuthAccess | undefined;
  protected editData: Partial<AuthorizedAccessFormValues> | null = null;
  protected definition!: FormDefinition<AuthorizedAccessFormValues>;

  ngOnInit(): void {
    this.editingAccess = this.slideInRef ? this.slideInRef.getData() : this.access();

    // Confirm fields aren't persisted, so seed them from the saved secrets.
    this.editData = this.editingAccess
      ? {
          ...this.editingAccess,
          secret_confirm: this.editingAccess.secret,
          peersecret_confirm: this.editingAccess.peersecret,
        }
      : null;

    this.definition = getAuthorizedAccessFormConfig(this.api, this.translate, this.editingAccess);
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
