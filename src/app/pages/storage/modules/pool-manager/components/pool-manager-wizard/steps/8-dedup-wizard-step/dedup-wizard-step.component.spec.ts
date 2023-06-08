import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { mockProvider, Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { LayoutStepComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/components/layout-step/layout-step.component';
import { DedupWizardStepComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/8-dedup-wizard-step/dedup-wizard-step.component';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';

describe('DedupWizardStepComponent', () => {
  let spectator: Spectator<DedupWizardStepComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: DedupWizardStepComponent,
    imports: [
      IxFormsModule,
    ],
    declarations: [
      MockComponent(LayoutStepComponent),
    ],
    providers: [
      mockProvider(PoolManagerStore, {
        topology$: of({}),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('has back button', async () => {
    const backBtn = await loader.getHarness(MatButtonHarness.with({ text: 'Back' }));
    expect(backBtn).toBeTruthy();
  });
});
