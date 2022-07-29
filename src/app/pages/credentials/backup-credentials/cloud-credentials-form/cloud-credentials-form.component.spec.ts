import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { CloudCredentialsFormComponent } from './cloud-credentials-form.component';

describe('CloudCredentialsFormComponent', () => {
  let spectator: Spectator<CloudCredentialsFormComponent>;
  const createComponent = createComponentFactory({
    component: CloudCredentialsFormComponent,
    imports: [
      ReactiveFormsModule,
      IxFormsModule,
    ],
    providers: [
      mockProvider(IxSlideInService),
      mockProvider(SnackbarService),
      mockWebsocket([
        mockCall('cloudsync.credentials.create'),
        mockCall('cloudsync.credentials.update'),
        mockCall('cloudsync.credentials.verify', {
          valid: true,
        }),
        mockCall('cloudsync.providers', [

        ]),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  describe('rendering', () => {
    it('loads a list of providers and shows them in Provider select', () => {

    });

    it('renders dynamic provider specific form when Provider is changed', () => {

    });

    it('renders a token only form for some providers', () => {

    });
  });

  describe('verification', () => {
    it('verifies entered values when user presses Verify', () => {

    });

    it('shows an error when verification fails', () => {

    });
  });

  describe('saving', () => {
    it('shows existing values when form is opened for edit', () => {

    });

    it('saves new credentials when new form is saved', () => {

    });

    it('updates existing credentials when edit form is saved', () => {

    });
  });
});
