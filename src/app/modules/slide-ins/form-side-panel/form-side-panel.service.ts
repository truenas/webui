import { ComponentPortal } from '@angular/cdk/portal';
import { DOCUMENT } from '@angular/common';
import {
  ApplicationRef, ComponentRef, createComponent, EnvironmentInjector, inject, Injectable, Injector, Type,
} from '@angular/core';
import { Subject } from 'rxjs';
import {
  FormDefinition,
} from 'app/modules/forms/ix-forms/components/ix-form-renderer/form-definition.interface';
import { IxFormRendererComponent } from 'app/modules/forms/ix-forms/components/ix-form-renderer/ix-form-renderer.component';
import {
  FormSidePanelContainerComponent,
} from 'app/modules/slide-ins/form-side-panel/form-side-panel-container.component';
import { SidePanelHostCloseable } from 'app/modules/slide-ins/side-panel-form.directive';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { SlideInResponse } from 'app/modules/slide-ins/slide-in.interface';

/** A live panel in {@link FormSidePanelService}'s stack. */
interface OpenPanel {
  component: Type<SidePanelHostCloseable<unknown>>;
  result$: SlideInResult<unknown>;
  teardown: () => void;
  /** The panel's container, kept so {@link FormSidePanelService.swap} can replace its hosted component in place. */
  containerRef: ComponentRef<FormSidePanelContainerComponent>;
}

export interface FormSidePanelOptions {
  /**
   * Panel header text. Rendered raw (not piped through `translate`), so pass an
   * already-translated string, e.g. `translate.instant('Add Container')`.
   *
   * Note this is the opposite convention to {@link saveLabel} and footer-action labels, which are
   * untranslated markers piped in the container template — mind the difference when setting both.
   */
  title?: string;
  /** Explicit panel width; overrides {@link wide}. */
  width?: string;
  /** Convenience for two-column forms — `800px` instead of the default `480px`. */
  wide?: boolean;
  /** Test-id applied to the panel root. */
  testId?: string;
  /**
   * Footer submit-button label; defaults to `Save`. An untranslated marker (`T('Create')`) — the
   * container template pipes it through `translate`, so do NOT pre-translate with `instant()`.
   */
  saveLabel?: string;
  /** Inputs set on the hosted form before its `ngOnInit` (e.g. the record being edited). */
  inputs?: Record<string, unknown>;
  /**
   * Hide the panel footer (Save + secondary actions) — for hosted components that own their
   * actions inline, e.g. a `mat-stepper` wizard with Next/Back/Save buttons inside the steps.
   */
  footerless?: boolean;
}

/**
 * Opens a {@link SidePanelHostForm} in a `tn-side-panel`, imperatively — the form's host-agnostic
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
   * Live panels, oldest first. Usually holds a single panel — a config side panel is modal — but a
   * form may open another from within itself (e.g. an `ix-user-picker`'s "Add New" inside a hosted
   * form), so panels stack: each new one mounts its own host later in `document.body`, so at
   * tn-side-panel's shared `z-index` it paints on top, its backdrop dimming the panel beneath, and
   * pops to reveal it on close. A re-entrant open of the component already on top (e.g. a
   * double-fired menu click) is deduped — it returns the in-flight result instead of stacking a
   * duplicate.
   *
   * Panels are hosted on `document.body` (not in any route's view), so they outlive navigation
   * unless torn down explicitly — {@link closeAll} does that for every panel in the stack.
   */
  private stack: OpenPanel[] = [];

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
    // The renderer implements SidePanelHostForm, so it's accepted by `open` without a cast.
    return this.open(IxFormRendererComponent, {
      ...chrome,
      inputs: { definition, editData: editData ?? null },
    });
  }

  open<R = boolean>(component: Type<SidePanelHostCloseable<R>>, options: FormSidePanelOptions = {}): SlideInResult<R> {
    const top = this.stack[this.stack.length - 1];
    // Dedupe a re-entrant open of the component already on top (e.g. a double-fired menu click);
    // a different component is a genuine nested open and stacks on top.
    if (top?.component === component) {
      return top.result$ as SlideInResult<R>;
    }

    const close$ = new Subject<SlideInResponse<R>>();
    // Defaults to a cancel; overwritten with the form's response when it closes itself via save.
    let pendingResponse: R | undefined;

    const portal = new ComponentPortal<SidePanelHostCloseable<R>>(component, null, this.injector);
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
    containerRef.setInput('footerless', options.footerless ?? false);
    containerRef.setInput('portal', portal);

    // Single, idempotent teardown so the animated close and a forced (navigation) close
    // can never double-detach or double-destroy the host.
    let isTornDown = false;
    const teardown = (): void => {
      if (isTornDown) {
        return;
      }
      isTornDown = true;
      this.stack = this.stack.filter((panel) => panel.teardown !== teardown);
      close$.next({ response: pendingResponse });
      close$.complete();
      this.appRef.detachView(containerRef.hostView);
      containerRef.destroy();
    };

    containerRef.instance.formAttached.subscribe((form) => {
      // Form-initiated close (save / cancel). A truthy payload is a success — `true` for the
      // default boolean form, or the created record for a richer `R`; any falsy value is a
      // cancellation, matching SlideInResult's `=== undefined` convention.
      (form as SidePanelHostCloseable<R>).closed.subscribe((saved) => {
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

    const result$ = new SlideInResult<R>(close$);
    this.stack.push({
      component: component as Type<SidePanelHostCloseable<unknown>>,
      result$,
      teardown,
      containerRef,
    });
    return result$;
  }

  /**
   * Replaces the hosted component in the TOP open panel in place — the panel chrome (header, backdrop,
   * focus trap, the {@link SlideInResult} listeners) stays, only the projected content swaps. This is
   * the panel equivalent of the legacy `SlideInRef.swap`, used for wizard ⇄ advanced-form switches.
   *
   * The new component's `closed` is re-wired automatically: the container re-emits `formAttached`
   * when the portal re-attaches, and {@link open}'s subscription wires each attached form's close.
   * No-op if no panel is open.
   */
  swap(component: Type<SidePanelHostCloseable>, options: FormSidePanelOptions = {}): void {
    const top = this.stack[this.stack.length - 1];
    if (!top || top.containerRef.hostView.destroyed) {
      return;
    }
    const { containerRef } = top;

    containerRef.setInput('title', options.title ?? '');
    containerRef.setInput('width', options.width ?? (options.wide ? '800px' : '480px'));
    containerRef.setInput('saveLabel', options.saveLabel ?? 'Save');
    containerRef.setInput('footerless', options.footerless ?? false);
    containerRef.setInput('formInputs', options.inputs ?? {});
    // Changing the portal input makes `cdkPortalOutlet` detach the old component and attach the new.
    containerRef.setInput('portal', new ComponentPortal<SidePanelHostCloseable>(component, null, this.injector));
    containerRef.changeDetectorRef.detectChanges();
    // Keep the stack entry's component in sync so the re-entrant-open dedupe stays correct.
    top.component = component as Type<SidePanelHostCloseable<unknown>>;
  }

  /**
   * Tears down every open panel immediately (no close animation), resolving each as a cancel.
   * Called on navigation, mirroring `SlideIn.closeAll()`, so a config form never orphans on
   * `document.body` after its originating route is gone.
   */
  closeAll(): void {
    // Snapshot first — each teardown mutates `this.stack`.
    [...this.stack].forEach((panel) => panel.teardown());
  }
}
