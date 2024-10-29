import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { VirtualizationRemote } from 'app/enums/virtualization.enum';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { InstanceFormComponent } from './instance-form.component';

describe('InstanceFormComponent', () => {
  let spectator: Spectator<InstanceFormComponent>;
  let loader: HarnessLoader;

  const mockImages = {
    1: { label: 'Ubuntu 20.04', os: 'Ubuntu', release: '20.04', arch: 'x86_64', variant: 'Server' },
    2: { label: 'Ubuntu 22.04', os: 'Ubuntu', release: '22.04', arch: 'x86_64', variant: 'Desktop' },
    3: { label: 'Debian 10', os: 'Debian', release: '10', arch: 'x86_64', variant: 'Server' },
  };

  const createComponent = createComponentFactory({
    component: InstanceFormComponent,
    providers: [
      mockWebSocket([
        mockCall('virt.instance.image_choices', mockImages),
      ]),
      {
        provide: MatDialogRef,
        useValue: {
          close: jest.fn(),
        },
      },
      {
        provide: MAT_DIALOG_DATA,
        useValue: { remote: VirtualizationRemote.LinuxContainers },
      },
    ],
    declarations: [
      MockComponent(IxFieldsetComponent),
      MockComponent(IxSelectComponent),
      MockComponent(IxInputComponent),
      MockComponent(EmptyComponent),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('should create the form with searchQuery, os, variant, and release controls', () => {
    expect(spectator.component.form.contains('searchQuery')).toBe(true);
    expect(spectator.component.form.contains('os')).toBe(true);
    expect(spectator.component.form.contains('variant')).toBe(true);
    expect(spectator.component.form.contains('release')).toBe(true);
  });

  it('should load the images and set filter options on init', () => {
    expect(spectator.component.images()).toEqual(Object.values(mockImages));
    expect(spectator.component.osOptions$).toBeTruthy();
    expect(spectator.component.variantOptions$).toBeTruthy();
    expect(spectator.component.releaseOptions$).toBeTruthy();
  });

  it('should filter images based on form controls', () => {
    spectator.component.form.patchValue({ os: 'Ubuntu', variant: 'Server', release: '20.04' });

    const filteredImages = spectator.component.filteredImages();

    expect(filteredImages).toHaveLength(1);
    expect(filteredImages[0].label).toBe('Ubuntu 20.04');
  });

  it('should show all images if no filters are applied', () => {
    spectator.component.form.reset();

    expect(spectator.component.filteredImages()).toHaveLength(3);
  });

  it('should close the dialog with selected image when "Select" is clicked', async () => {
    const button = await loader.getHarness(MatButtonHarness.with({ text: 'Select' }));
    await button.click();

    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith(Object.values(mockImages)[0]);
  });
});
