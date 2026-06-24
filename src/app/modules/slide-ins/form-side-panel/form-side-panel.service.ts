import { ComponentPortal } from '@angular/cdk/portal';
import { DOCUMENT } from '@angular/common';
import {
  ApplicationRef, createComponent, EnvironmentInjector, inject, Injectable, Injector, Type,
} from '@angular/core';
import { Subject } from 'rxjs';
import {
  FormDefinition,
} from 'app/modules/forms/ix-forms/components/ix-form-renderer/form-definition.interface';
import { IxFormRendererComponent } from 'app/modules/forms/ix-forms/components/ix-form-renderer/ix-form-renderer.component';
import {
  FormSidePanelContainerComponent,
} from 'app/modules/slide-ins/form-side-panel/form-side-panel-container.component';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { SlideInResponse } from 'app/modules/slide-ins/slide-in.interface';

export interface FormSidePanelOptions {
  /** Panel header text. */
  title?: string;
  /** Explicit panel width; overrides {@link wide}. */
  width?: string;
  /** Convenience for two-column forms — `800px` instead of the default `480px`. */
  wide?: boolean;
  /** Test-id applied to the panel root. */
  testId?: string;
  /** Footer submit-button label; defaults to `Save`. */
  saveLabel?: string;
  /** Inputs set on the hosted form before its `ngOnInit` (e.g. the record being edited). */
  inputs?: Record<string, unknown>;
}

/**
 * Opens a {@link SidePanelForm} in a `tn-side-panel`, imperatively — the form's host-agnostic
 * "side-panel" mode (no {@link SlideInRef}; exposes `closed` / `canSubmit` / `submit`).
 *
 * This is the go-forward replacement for declaring a `<tn-side-panel>` in every card/page that
 * hosts a config form: callers just `open(FormComponent)` and the chrome (header, close button,
 * focus trap, footer Save, unsaved-changes guard) lives in one place.
 *
 * ```ts
 * this.formPanel.open(ServiceNfsComponent, { title: 'NFS', wide: true })
 *   .onSuccess(() => this.dataProvider.load(), this.destroyRef);
 * ```
 */
@Injectable({ providedIn: 'root' })
export class FormSidePanelService {
  private appRef = inject(ApplicationRef);
  private environmentInjector = inject(EnvironmentInjector);
  private injector = inject(Injector);
  private document = inject(DOCUMENT);

  /**
   * State for the single live panel, if one is open. A config side panel is modal — only one is
   * meaningful at a time — so re-entrant opens (e.g. a double-fired menu click) return the same
   * {@link FormSidePanelService.currentResult} instead of stacking a second host on `document.body`.
   *
   * The panel is hosted on `document.body` (not in any route's view), so it outlives navigation
   * unless {@link FormSidePanelService.closeCurrent} is invoked explicitly — {@link closeAll} does
   * that. Both fields are set together when a panel opens and cleared together on teardown.
   */
  private currentResult: SlideInResult<boolean> | null = null;
  private closeCurrent: (() => void) | null = null;

  /**
   * Opens a declarative {@link FormDefinition} in the side panel without a per-form wrapper
   * component — hosts {@link IxFormRendererComponent} directly with the definition (and optional
   * `editData`) as inputs. Use this for config forms whose only per-form code is their
   * `*.form-config.ts`; reach for {@link open} only when a form needs bespoke component logic.
   *
   * ```ts
   * this.formPanel.openForm(getNtpServersFormConfig(this.api, this.translate, server), {
   *   title: 'Edit NTP Server', editData: server,
   * }).onSuccess(() => this.reload(), this.destroyRef);
   * ```
   */
  openForm<T extends object>(
    definition: FormDefinition<T>,
    options: Omit<FormSidePanelOptions, 'inputs'> & { editData?: Partial<T> | object | null } = {},
  ): SlideInResult<boolean> {
    const { editData, ...chrome } = options;
    // The renderer structurally provides the host surface (closed/canSubmit/submit/
    // hasUnsavedChanges/requiredRoles) the container reads; cast past the nominal base type.
    return this.open(IxFormRendererComponent as unknown as Type<SidePanelForm>, {
      ...chrome,
      inputs: { definition, editData: editData ?? null },
    });
  }

  open(component: Type<SidePanelForm>, options: FormSidePanelOptions = {}): SlideInResult<boolean> {
    if (this.currentResult) {
      return this.currentResult;
    }

    const close$ = new Subject<SlideInResponse<boolean>>();
    // Defaults to a cancel; overwritten with the form's response when it closes itself via save.
    let pendingResponse: boolean | undefined;

    const portal = new ComponentPortal<SidePanelForm>(component, null, this.injector);
    const containerRef = createComponent(FormSidePanelContainerComponent, {
      environmentInjector: this.environmentInjector,
    });

    containerRef.setInput('title', options.title ?? '');
    containerRef.setInput('width', options.width ?? (options.wide ? '800px' : '480px'));
    containerRef.setInput('testId', options.testId);
    containerRef.setInput('formInputs', options.inputs ?? {});
    if (options.saveLabel) {
      containerRef.setInput('saveLabel', options.saveLabel);
    }
    containerRef.setInput('portal', portal);

    // Single, idempotent teardown so the animated close and a forced (navigation) close
    // can never double-detach or double-destroy the host.
    let isTornDown = false;
    const teardown = (): void => {
      if (isTornDown) {
        return;
      }
      isTornDown = true;
      this.currentResult = null;
      this.closeCurrent = null;
      close$.next({ response: pendingResponse });
      close$.complete();
      this.appRef.detachView(containerRef.hostView);
      containerRef.destroy();
    };

    containerRef.instance.formAttached.subscribe((form) => {
      // Form-initiated close (save / cancel). `saved === true` is the only success; everything
      // else is a cancellation, matching SlideInResult's `=== undefined` convention.
      form.closed.subscribe((saved) => {
        pendingResponse = saved || undefined;
        containerRef.setInput('open', false);
      });
    });

    containerRef.instance.panelClosed.subscribe(() => teardown());

    this.appRef.attachView(containerRef.hostView);
    this.document.body.appendChild(containerRef.location.nativeElement as HTMLElement);

    // Defer opening until the panel has painted in its closed (off-screen) state, otherwise
    // tn-side-panel's transform transition has nothing to animate from and the panel just
    // appears. Two frames guarantee a paint with the `--initialized` class applied first.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (!containerRef.hostView.destroyed) {
        containerRef.setInput('open', true);
      }
    }));

    this.closeCurrent = teardown;
    this.currentResult = new SlideInResult<boolean>(close$);
    return this.currentResult;
  }

  /**
   * Tears down the open panel immediately (no close animation), resolving it as a cancel.
   * Called on navigation, mirroring `SlideIn.closeAll()`, so a config form never orphans on
   * `document.body` after its originating route is gone.
   */
  closeAll(): void {
    this.closeCurrent?.();
  }
}
