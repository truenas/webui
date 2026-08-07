/* eslint-disable max-classes-per-file */
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, signal,
} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { TnButtonHarness, TnIconTesting, TnSidePanelHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Role } from 'app/enums/role.enum';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
import { UnsavedChangesService } from 'app/modules/unsaved-changes/unsaved-changes.service';

@Component({
  selector: 'ix-test-form',
  template: '<p>nfs form body</p>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class TestFormComponent extends SidePanelForm {
  protected readonly form = new FormControl('');
  readonly canSubmit = signal(true);
  readonly requiredRoles = [Role.SharingNfsWrite];
  readonly submitSpy = jest.fn();

  protected onSubmit(): void {
    this.submitSpy();
    this.close(true);
  }
}

@Component({
  selector: 'ix-second-test-form',
  template: '<p>smb form body</p>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class SecondTestFormComponent extends SidePanelForm {
  protected readonly form = new FormControl('');
  readonly canSubmit = signal(true);

  protected onSubmit(): void {
    this.close(true);
  }
}

@Component({
  selector: 'ix-wizard-test-form',
  template: '<p>wizard form body</p>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class WizardTestFormComponent extends SidePanelForm {
  /** Static so the test can flip it without a handle on the portaled instance. */
  static readonly saveHidden = signal(true);

  protected readonly form = new FormControl('');
  readonly canSubmit = signal(true);

  hideSave(): boolean {
    return WizardTestFormComponent.saveHidden();
  }

  protected onSubmit(): void {
    this.close(true);
  }
}

/** Closes with whatever the static payload signal holds, to exercise the truthiness contract. */
@Component({
  selector: 'ix-payload-test-form',
  template: '<p>payload form body</p>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class PayloadTestFormComponent extends SidePanelForm<unknown> {
  /** Static so the test can set it without a handle on the portaled instance. */
  static readonly payload = signal<unknown>(true);

  protected readonly form = new FormControl('');
  readonly canSubmit = signal(true);

  protected onSubmit(): void {
    this.closeWith(PayloadTestFormComponent.payload());
  }
}

/** Bails out in `ngOnInit`, i.e. before the service's deferred open has run. */
@Component({
  selector: 'ix-bail-out-test-form',
  template: '<p>bail-out form body</p>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class BailOutTestFormComponent extends SidePanelForm implements OnInit {
  protected readonly form = new FormControl('');
  readonly canSubmit = signal(true);

  ngOnInit(): void {
    this.close(false);
  }

  protected onSubmit(): void {}
}

@Component({ selector: 'ix-test-host', template: '', changeDetection: ChangeDetectionStrategy.OnPush })
class TestHostComponent {}

describe('FormSidePanelService', () => {
  let service: FormSidePanelService;
  let fixture: ComponentFixture<TestHostComponent>;
  let rootLoader: HarnessLoader;
  /** Frames queued by the service while `deferAnimationFrames()` is in effect. */
  let queuedFrames: FrameRequestCallback[];

  // Real CSS transitions don't run in jsdom, so the panel's `closed` output (fired on
  // transitionend) must be simulated to exercise the full open→save→close lifecycle.
  function flushPanelClose(): void {
    const panelEl = document.querySelector('.tn-side-panel__panel');
    // jsdom lacks TransitionEvent; a plain Event with propertyName set is enough for the handler.
    const event = new Event('transitionend');
    Object.defineProperty(event, 'propertyName', { value: 'transform' });
    panelEl?.dispatchEvent(event);
    fixture.detectChanges();
  }

  /**
   * Restores the real (deferred) animation-frame timing for a test, queueing callbacks instead of
   * running them — the only way to observe the window between `open()` and the panel opening.
   */
  function deferAnimationFrames(): void {
    jest.spyOn(global, 'requestAnimationFrame').mockImplementation((callback) => {
      queuedFrames.push(callback);
      return 0;
    });
  }

  /** Drains queued frames, including ones queued by the frames themselves. */
  function flushAnimationFrames(): void {
    while (queuedFrames.length) {
      queuedFrames.splice(0, queuedFrames.length).forEach((callback) => callback(0));
    }
    fixture.detectChanges();
  }

  beforeEach(() => {
    queuedFrames = [];
    // The service defers opening across two animation frames; run them synchronously in tests.
    jest.spyOn(global, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0);
      return 0;
    });

    TestBed.configureTestingModule({
      imports: [
        TestHostComponent, TestFormComponent, SecondTestFormComponent, WizardTestFormComponent,
        PayloadTestFormComponent, BailOutTestFormComponent, TranslateModule.forRoot(),
      ],
      providers: [
        mockAuth(),
        {
          provide: UnsavedChangesService,
          useValue: { showConfirmDialog: jest.fn(() => of(true)) },
        },
        ...TnIconTesting.jest.providers(),
      ],
    });
    service = TestBed.inject(FormSidePanelService);
    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    rootLoader = TestbedHarnessEnvironment.documentRootLoader(fixture);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('opens a tn-side-panel hosting the form with the given title', async () => {
    service.open(TestFormComponent, { title: 'NFS' });
    fixture.detectChanges();

    const panel = await rootLoader.getHarness(TnSidePanelHarness);
    expect(await panel.isOpen()).toBe(true);
    expect(await panel.getTitle()).toBe('NFS');
    expect(await panel.getContentText()).toContain('nfs form body');
  });

  it('submits the form and resolves onSuccess when Save is clicked', async () => {
    const onSuccess = jest.fn();
    const destroyRef = fixture.componentRef.injector.get(DestroyRef);
    service.open(TestFormComponent, { title: 'NFS' }).onSuccess(onSuccess, destroyRef);
    fixture.detectChanges();

    const save = await rootLoader.getHarness(TnButtonHarness.with({ label: 'Save' }));
    await save.click();
    flushPanelClose();

    expect(onSuccess).toHaveBeenCalledWith(true);
  });

  it('hides the footer Save while the hosted form\'s hideSave() returns true', async () => {
    WizardTestFormComponent.saveHidden.set(true);
    service.open(WizardTestFormComponent, { title: 'Wizard' });
    fixture.detectChanges();

    expect(await rootLoader.hasHarness(TnButtonHarness.with({ label: 'Save' }))).toBe(false);

    // E.g. the wizard advanced to its final step.
    WizardTestFormComponent.saveHidden.set(false);
    fixture.detectChanges();

    expect(await rootLoader.hasHarness(TnButtonHarness.with({ label: 'Save' }))).toBe(true);
  });

  it('removes the panel from the DOM after it closes', async () => {
    service.open(TestFormComponent, { title: 'NFS' });
    fixture.detectChanges();

    const save = await rootLoader.getHarness(TnButtonHarness.with({ label: 'Save' }));
    await save.click();
    flushPanelClose();

    expect(await rootLoader.hasHarness(TnSidePanelHarness)).toBe(false);
  });

  it('dedupes a re-entrant open of the same component, returning the in-flight result', async () => {
    const first$ = service.open(TestFormComponent, { title: 'NFS' });
    fixture.detectChanges();

    const second$ = service.open(TestFormComponent, { title: 'NFS' });
    fixture.detectChanges();

    expect(second$).toBe(first$);
    expect(await rootLoader.getAllHarnesses(TnSidePanelHarness)).toHaveLength(1);

    const panel = await rootLoader.getHarness(TnSidePanelHarness);
    expect(await panel.getTitle()).toBe('NFS');
  });

  it('stacks a second panel for a different component (nested open)', async () => {
    service.open(TestFormComponent, { title: 'NFS' });
    fixture.detectChanges();

    service.open(SecondTestFormComponent, { title: 'SMB' });
    fixture.detectChanges();

    // Both panels are mounted; the newer one is appended later so it paints on top.
    expect(await rootLoader.getAllHarnesses(TnSidePanelHarness)).toHaveLength(2);
  });

  it('closeAll tears down every panel in the stack', async () => {
    service.open(TestFormComponent, { title: 'NFS' });
    fixture.detectChanges();
    service.open(SecondTestFormComponent, { title: 'SMB' });
    fixture.detectChanges();
    expect(await rootLoader.getAllHarnesses(TnSidePanelHarness)).toHaveLength(2);

    service.closeAll();
    fixture.detectChanges();

    expect(await rootLoader.hasHarness(TnSidePanelHarness)).toBe(false);
  });

  it('tears down instead of opening when the form closes before the deferred open runs', async () => {
    deferAnimationFrames();
    const onCancel = jest.fn();
    const destroyRef = fixture.componentRef.injector.get(DestroyRef);
    service.open(BailOutTestFormComponent, { title: 'Bail out' }).onCancel(onCancel, destroyRef);
    // Renders the form, whose ngOnInit closes it — while `open` is still false.
    fixture.detectChanges();

    flushAnimationFrames();

    // Without the latch, `setInput('open', false)` was a no-op, tn-side-panel never emitted
    // `closed`, and the panel then animated open on a form that had already given up.
    expect(await rootLoader.hasHarness(TnSidePanelHarness)).toBe(false);
    expect(onCancel).toHaveBeenCalled();
  });

  it('allows opening a new panel after the previous one closed', async () => {
    service.open(TestFormComponent, { title: 'NFS' });
    fixture.detectChanges();
    service.closeAll();
    fixture.detectChanges();

    service.open(TestFormComponent, { title: 'SMB' });
    fixture.detectChanges();

    const panel = await rootLoader.getHarness(TnSidePanelHarness);
    expect(await panel.getTitle()).toBe('SMB');
  });

  it('closeAll tears down open panels immediately and resolves them as cancelled', async () => {
    const onCancel = jest.fn();
    const onSuccess = jest.fn();
    const destroyRef = fixture.componentRef.injector.get(DestroyRef);
    const result$ = service.open(TestFormComponent, { title: 'NFS' });
    result$.onCancel(onCancel, destroyRef);
    result$.onSuccess(onSuccess, destroyRef);
    fixture.detectChanges();

    expect(await rootLoader.hasHarness(TnSidePanelHarness)).toBe(true);

    service.closeAll();
    fixture.detectChanges();

    expect(await rootLoader.hasHarness(TnSidePanelHarness)).toBe(false);
    expect(onCancel).toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  // Locks the truthiness contract documented on `SidePanelForm.closeWith` / `SubmitResult.closeWith`:
  // this host is deliberately narrower than SlideInResult's `=== undefined` rule, because a plain
  // boolean form emits `false` to mean "closed without saving".
  describe('close payload truthiness', () => {
    async function closeWithPayload(payload: unknown): Promise<{ onSuccess: jest.Mock; onCancel: jest.Mock }> {
      PayloadTestFormComponent.payload.set(payload);
      const onSuccess = jest.fn();
      const onCancel = jest.fn();
      const destroyRef = fixture.componentRef.injector.get(DestroyRef);
      const result$ = service.open(PayloadTestFormComponent, { title: 'Payload' });
      result$.onSuccess(onSuccess, destroyRef);
      result$.onCancel(onCancel, destroyRef);
      fixture.detectChanges();

      await (await rootLoader.getHarness(TnButtonHarness.with({ label: 'Save' }))).click();
      flushPanelClose();

      return { onSuccess, onCancel };
    }

    it('resolves an empty array as a success, so an all-failed bulk still reloads', async () => {
      const { onSuccess, onCancel } = await closeWithPayload([]);

      expect(onSuccess).toHaveBeenCalledWith([]);
      expect(onCancel).not.toHaveBeenCalled();
    });

    it('resolves a falsy payload as a cancel', async () => {
      const { onSuccess, onCancel } = await closeWithPayload(0);

      expect(onSuccess).not.toHaveBeenCalled();
      expect(onCancel).toHaveBeenCalled();
    });
  });
});
