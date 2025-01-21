import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { fakeAsync, tick } from '@angular/core/testing';
import {
  FormControl, FormGroup, NgControl, ReactiveFormsModule,
} from '@angular/forms';
import { MatAutocomplete } from '@angular/material/autocomplete';
import { createHostFactory, mockProvider, SpectatorHost } from '@ngneat/spectator/jest';
import { of, Subject } from 'rxjs';
import { NavigateAndHighlightService } from 'app/directives/navigate-and-interact/navigate-and-highlight.service';
import { IxFormGlossaryComponent } from 'app/modules/forms/ix-forms/components/ix-form-glossary/ix-form-glossary.component';
import { IxFormSectionComponent } from 'app/modules/forms/ix-forms/components/ix-form-section/ix-form-section.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxInputHarness } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.harness';
import { IxFormService } from 'app/modules/forms/ix-forms/services/ix-form.service';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';

describe('IxFormGlossaryComponent', () => {
  let spectator: SpectatorHost<IxFormGlossaryComponent>;
  let harnessLoader: HarnessLoader;
  const statusChanges$ = new Subject<void>();
  const element = document.createElement('div');

  const createHost = createHostFactory({
    component: IxFormGlossaryComponent,
    imports: [
      IxInputComponent,
      ReactiveFormsModule,
      IxFormSectionComponent,
      IxIconComponent,
      MatAutocomplete,
    ],
    providers: [
      mockProvider(IxFormService, {
        controlSections$: of([
          {
            section: { label: () => 'Section' } as IxFormSectionComponent,
            controls: [
              { valid: true, statusChanges: statusChanges$ } as unknown as NgControl,
              { valid: false, statusChanges: statusChanges$ } as unknown as NgControl,
            ],
          },
        ]),
        controlNamesWithLabels$: of([
          {
            label: 'Control1',
            name: 'control1',
          },
          {
            label: 'Control2',
            name: 'control2',
          },
        ]),
        getElementByControlName: jest.fn(() => element),
      }),
      mockProvider(NavigateAndHighlightService),
    ],
  });

  beforeEach(() => {
    spectator = createHost(`
      <form [formGroup]="fg"><ix-form-section [label]="'Section'"><ix-input [formControlName]="'control1'" [label]="'Control1'"></ix-input> <ix-input [formControlName]="'control2'" [label]="'Control2'"></ix-input></ix-form-section></form> <ix-form-glossary></ix-form-glossary>
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
    const input = await harnessLoader.getHarness(IxInputHarness.with({ label: 'Search' }));
    await input.setValue('Control2');
    const matAutocomplete = await input.getMatAutoCompleteHarness();
    const options = await matAutocomplete.getOptions();
    const optionsText: string[] = [];
    for (const option of options) {
      optionsText.push(await option.getText());
    }
    expect(optionsText).toEqual(['Control2']);
    expect(spectator.inject(NavigateAndHighlightService).scrollIntoView).toHaveBeenCalledWith(element);
  });

  it('shows sections as options', fakeAsync(() => {
    spectator.detectChanges();
    tick(100);
    const sections = spectator.queryAll('.section');
    expect(sections.map((section) => section.textContent)).toEqual([' Section ']);
  }));
});
