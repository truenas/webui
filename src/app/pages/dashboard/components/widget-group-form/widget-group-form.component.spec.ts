import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { Spectator } from '@ngneat/spectator';
import { mockProvider, createComponentFactory } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { IxIconGroupHarness } from 'app/modules/ix-forms/components/ix-icon-group/ix-icon-group.harness';
import { ChainedRef } from 'app/modules/ix-forms/components/ix-slide-in/chained-component-ref';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { WidgetEditorGroupComponent } from 'app/pages/dashboard/components/widget-group-form/widget-editor-group/widget-editor-group.component';
import { WidgetGroupFormComponent } from 'app/pages/dashboard/components/widget-group-form/widget-group-form.component';
import { WidgetGroup, WidgetGroupLayout } from 'app/pages/dashboard/types/widget-group.interface';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

describe('WidgetGroupFormComponent', () => {
  let spectator: Spectator<WidgetGroupFormComponent>;
  let loader: HarnessLoader;

  const chainedComponentRef: ChainedRef<WidgetGroup> = {
    close: jest.fn(),
    getData: jest.fn(() => ({ layout: WidgetGroupLayout.Full, slots: [] })),
    swap: jest.fn(),
  };

  const createComponent = createComponentFactory({
    component: WidgetGroupFormComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
      MatIconTestingModule,
    ],
    declarations: [
      MockComponent(WidgetEditorGroupComponent),
    ],
    providers: [
      mockProvider(ChainedRef, chainedComponentRef),
      mockProvider(IxSlideInService),
      mockProvider(FormErrorHandlerService),
      mockProvider(SnackbarService),
      mockProvider(IxSlideInRef),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('checks layout selector', async () => {
    const layoutSelector = await loader.getHarness(IxIconGroupHarness.with({ label: 'Layouts' }));
    expect(await layoutSelector.getValue()).toEqual(WidgetGroupLayout.Full);

    await layoutSelector.setValue(WidgetGroupLayout.Halves);
    expect(await layoutSelector.getValue()).toEqual(WidgetGroupLayout.Halves);
  });
});
