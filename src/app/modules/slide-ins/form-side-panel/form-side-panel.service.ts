import { ComponentPortal } from '@angular/cdk/portal';
import { DOCUMENT } from '@angular/common';
import {
  ApplicationRef, createComponent, EnvironmentInjector, inject, Injectable, Injector, Type,
} from '@angular/core';
import { isObservable, Observable, Subject } from 'rxjs';
import { take } from 'rxjs/operators';
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
    // Union of a ready definition OR an async builder — not always an observable, so no `$`.
    // eslint-disable-next-line @smarttools/rxjs/finnish
    source: FormDefinition<T> | Observable<{ definition: FormDefinition<T>; editData?: Partial<T> | object | null }>,
    options: Omit<FormSidePanelOptions, 'inputs'> & { editData?: Partial<T> | object | null } = {},
  ): SlideInResult<boolean> {
    const { editData, ...chrome } = options;
    // The renderer structurally provides the host surface (closed/canSubmit/submit/
    // hasUnsavedChanges/requiredRoles) the container reads; cast past the nominal base type.
    const renderer = IxFormRendererComponent as unknown as Type<SidePanelForm>;
    const { result$, attachForm } = this.openContainer(chrome);

    if (isObservable(source)) {
      // Open the panel immediately (the container shows a loading bar) and attach the
      // renderer once the form's async setup resolves — no pre-open delay.
      source.pipe(take(1)).subscribe((resolved) => {
        attachForm(renderer, { definition: resolved.definition, editData: resolved.editData ?? null });
      });
    } else {
      attachForm(renderer, { definition: source, editData: editData ?? null });
    }

    return result$;
  }

  open(component: Type<SidePanelForm>, options: FormSidePanelOptions = {}): SlideInResult<boolean> {
    const { result$, attachForm } = this.openContainer(options);
    attachForm(component, options.inputs ?? {});
    return result$;
  }

  /**
   * Creates and opens the panel chrome immediately, returning the close result plus an
   * `attachForm` callback that portals the form (with its inputs) into it — synchronously
   * for {@link open}, or after an async resolve for {@link openForm}. Until `attachForm`
   * runs, the container renders a loading bar.
   */
  private openContainer(
    options: Pick<FormSidePanelOptions, 'title' | 'width' | 'wide' | 'testId' | 'saveLabel'>,
  ): {
    result$: SlideInResult<boolean>;
    attachForm: (component: Type<SidePanelForm>, inputs: Record<string, unknown>) => void;
  } {
    if (this.currentResult) {
      return { result$: this.currentResult, attachForm: () => { /* one panel at a time */ } };
    }

    const close$ = new Subject<SlideInResponse<boolean>>();
    // Defaults to a cancel; overwritten with the form's response when it closes itself via save.
    let pendingResponse: boolean | undefined;

    const containerRef = createComponent(FormSidePanelContainerComponent, {
      environmentInjector: this.environmentInjector,
    });

    containerRef.setInput('title', options.title ?? '');
    containerRef.setInput('width', options.width ?? (options.wide ? '800px' : '480px'));
    containerRef.setInput('testId', options.testId);
    if (options.saveLabel) {
      containerRef.setInput('saveLabel', options.saveLabel);
    }

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

    // Portals the form once its inputs are ready (immediately, or after an async resolve).
    const attachForm = (component: Type<SidePanelForm>, inputs: Record<string, unknown>): void => {
      if (containerRef.hostView.destroyed) {
        return;
      }
      containerRef.setInput('formInputs', inputs);
      containerRef.setInput('portal', new ComponentPortal<SidePanelForm>(component, null, this.injector));
    };

    this.closeCurrent = teardown;
    this.currentResult = new SlideInResult<boolean>(close$);
    return { result$: this.currentResult, attachForm };
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
