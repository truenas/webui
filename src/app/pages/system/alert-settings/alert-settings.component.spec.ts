import { Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { AlertConfigFormComponent } from 'app/pages/system/alert-config-form/alert-config-form.component';
import { AlertServiceListComponent } from 'app/pages/system/alert-service/alert-service-list/alert-service-list.component';
import { AlertSettingsComponent } from 'app/pages/system/alert-settings/alert-settings.component';

describe('AlertSettingsComponent', () => {
  let spectator: Spectator<AlertSettingsComponent>;
  const createComponent = createComponentFactory({
    component: AlertSettingsComponent,
    declarations: [
      MockComponents(
        AlertServiceListComponent,
        AlertConfigFormComponent,
      ),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('shows cards with alert settings', () => {
    expect(spectator.query(AlertServiceListComponent)).toExist();
    expect(spectator.query(AlertConfigFormComponent)).toExist();
  });
});
