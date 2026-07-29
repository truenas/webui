import { ComponentPortal } from '@angular/cdk/portal';
import {
  ChangeDetectionStrategy, Component, signal,
} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { TnIconTesting } from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { FormSidePanelContainerComponent } from 'app/modules/slide-ins/form-side-panel/form-side-panel-container.component';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
import { UnsavedChangesService } from 'app/modules/unsaved-changes/unsaved-changes.service';

@Component({
  selector: 'ix-busy-test-form',
  template: '<p>form body</p>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class BusyTestFormComponent extends SidePanelForm {
  protected readonly form = new FormControl('');
  readonly canSubmit = signal(true);
  readonly busy = signal(false);

  override isBusy(): boolean {
    return this.busy();
  }

  protected onSubmit(): void {
    this.close(true);
  }
}

describe('FormSidePanelContainerComponent busy overlay', () => {
  let fixture: ComponentFixture<FormSidePanelContainerComponent>;

  const getForm = (): BusyTestFormComponent => fixture.debugElement.query(
    (node) => node.componentInstance instanceof BusyTestFormComponent,
  ).componentInstance as BusyTestFormComponent;

  // The panel renders through an overlay portaled to document.body, so query the document root.
  const getOverlay = (): Element | null => document.querySelector('.panel-content__busy-overlay');

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FormSidePanelContainerComponent, BusyTestFormComponent, TranslateModule.forRoot()],
      providers: [
        mockAuth(),
        {
          provide: UnsavedChangesService,
          useValue: { showConfirmDialog: jest.fn(() => of(true)) },
        },
        ...TnIconTesting.jest.providers(),
      ],
    });

    fixture = TestBed.createComponent(FormSidePanelContainerComponent);
    fixture.componentRef.setInput('portal', new ComponentPortal(BusyTestFormComponent));
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
  });

  it('shows no dimming overlay while the form is idle', () => {
    expect(getOverlay()).toBeNull();
  });

  it('shows the dimming overlay while the form is busy', () => {
    getForm().busy.set(true);
    fixture.detectChanges();

    expect(getOverlay()).not.toBeNull();
  });

  it('removes the overlay once the form is no longer busy', () => {
    getForm().busy.set(true);
    fixture.detectChanges();
    expect(getOverlay()).not.toBeNull();

    getForm().busy.set(false);
    fixture.detectChanges();

    expect(getOverlay()).toBeNull();
  });
});
