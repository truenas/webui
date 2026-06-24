import { ComponentPortal } from '@angular/cdk/portal';
import { DOCUMENT } from '@angular/common';
import {
  ApplicationRef, createComponent, EnvironmentInjector, inject, Injectable, Injector, Type,
} from '@angular/core';
import { Subject } from 'rxjs';
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
   * Teardown for each live panel. Panels are hosted on `document.body` (not in any route's
   * view), so they outlive navigation unless explicitly torn down — {@link closeAll} does that.
   */
  private readonly openPanels = new Set<() => void>();

  /**
   * The in-flight panel's result, if one is open. A config side panel is modal — only one is
   * meaningful at a time — so re-entrant opens (e.g. a double-fired menu click) return this
   * instead of stacking a second host on `document.body`. Cleared on teardown.
   */
  private currentResult: SlideInResult<boolean> | null = null;

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
      this.openPanels.delete(teardown);
      this.currentResult = null;
      close$.next({ response: pendingResponse });
      close$.complete();
      this.appRef.detachView(containerRef.hostView);
      containerRef.destroy();
    };
    this.openPanels.add(teardown);

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

    this.currentResult = new SlideInResult<boolean>(close$);
    return this.currentResult;
  }

  /**
   * Tears down every open panel immediately (no close animation), resolving each as a cancel.
   * Called on navigation, mirroring `SlideIn.closeAll()`, so a config form never orphans on
   * `document.body` after its originating route is gone.
   */
  closeAll(): void {
    // Each teardown deletes only its own entry, which is safe to do while iterating the Set.
    for (const teardown of this.openPanels) {
      teardown();
    }
  }
}
