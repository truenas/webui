/* eslint-disable max-classes-per-file */
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  ChangeDetectionStrategy, Component, DestroyRef, signal,
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

@Component({ selector: 'ix-test-host', template: '', changeDetection: ChangeDetectionStrategy.OnPush })
class TestHostComponent {}

describe('FormSidePanelService', () => {
  let service: FormSidePanelService;
  let fixture: ComponentFixture<TestHostComponent>;
  let rootLoader: HarnessLoader;

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

  beforeEach(() => {
    // The service defers opening across two animation frames; run them synchronously in tests.
    jest.spyOn(global, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0);
      return 0;
    });

    TestBed.configureTestingModule({
      imports: [TestHostComponent, TestFormComponent, TranslateModule.forRoot()],
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

  it('removes the panel from the DOM after it closes', async () => {
    service.open(TestFormComponent, { title: 'NFS' });
    fixture.detectChanges();

    const save = await rootLoader.getHarness(TnButtonHarness.with({ label: 'Save' }));
    await save.click();
    flushPanelClose();

    expect(document.querySelector('.tn-side-panel__panel')).toBeNull();
  });
});
