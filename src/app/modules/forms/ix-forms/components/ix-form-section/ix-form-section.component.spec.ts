import { mockProvider, createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { IxFormSectionComponent } from 'app/modules/forms/ix-forms/components/ix-form-section/ix-form-section.component';
import { IxFormService } from 'app/modules/forms/ix-forms/services/ix-form.service';

describe('IxFormSectionComponent', () => {
  let spectator: Spectator<IxFormSectionComponent>;
  const createComponent = createComponentFactory({
    component: IxFormSectionComponent,
    providers: [
      mockProvider(IxFormService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        label: 'Test Section',
        help: 'Test Help',
      },
    });
  });

  it('calls registerSectionControl when created', () => {
    expect(spectator.inject(IxFormService).registerSectionControl).toHaveBeenCalledWith(null, spectator.component);
  });

  it('calls unregisterSectionControl when destroyed', () => {
    spectator.component.ngOnDestroy();
    expect(spectator.inject(IxFormService).unregisterSectionControl).toHaveBeenCalledWith(spectator.component, null);
  });
});
