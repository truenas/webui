import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  FormControl, FormGroup, ReactiveFormsModule,
} from '@angular/forms';
import { MatAutocomplete } from '@angular/material/autocomplete';
import { createHostFactory, mockProvider, SpectatorHost } from '@ngneat/spectator/jest';
import { NavigateAndInteractService } from 'app/directives/navigate-and-interact/navigate-and-interact.service';
import { IxFormGlossaryComponent } from 'app/modules/forms/ix-forms/components/ix-form-glossary/ix-form-glossary.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxInputHarness } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.harness';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';

describe('IxFormGlossaryComponent', () => {
  let spectator: SpectatorHost<IxFormGlossaryComponent>;
  let harnessLoader: HarnessLoader;

  const createHost = createHostFactory({
    component: IxFormGlossaryComponent,
    imports: [
      IxInputComponent,
      ReactiveFormsModule,
      IxIconComponent,
    ],
    providers: [
      mockProvider(NavigateAndInteractService),
    ],
  });

  beforeEach(() => {
    spectator = createHost(`
      <form [formGroup]="fg"><ix-input [formControlName]="'control1'" [label]="'Control1'"></ix-input> <ix-input [formControlName]="'control2'" [label]="'Control2'"></ix-input></form> <ix-form-glossary></ix-form-glossary>
      `, {
      hostProps: {
        fg: new FormGroup({
          control1: new FormControl(),
          control2: new FormControl(),
        }),
      },
    });

    harnessLoader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('loads input options from form glossary', async () => {
    expect(spectator.component).toBeTruthy();
    const input = await harnessLoader.getHarness(IxInputHarness);
    await input.setValue('Control');
    spectator.detectChanges();
    const matAutocomplete = spectator.query(MatAutocomplete);
    matAutocomplete.showPanel = true;
    const options = matAutocomplete.options.map((option) => option.getLabel());
    expect(options).toEqual(['Control1', 'Control2']);
  });
});
