// eslint-disable-next-line max-classes-per-file
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component } from '@angular/core';
import { fakeAsync, tick } from '@angular/core/testing';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockProvider } from 'ng-mocks';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { AlertLevel } from 'app/enums/alert-level.enum';
import { AlertServiceType } from 'app/enums/alert-service-type.enum';
import { AlertService } from 'app/interfaces/alert-service.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/slide-ins/slide-in.token';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { AlertServiceComponent } from 'app/pages/system/alert-service/alert-service/alert-service.component';
import {
  AwsSnsServiceComponent,
} from 'app/pages/system/alert-service/alert-service/alert-services/aws-sns-service/aws-sns-service.component';
import {
  BaseAlertServiceForm,
} from 'app/pages/system/alert-service/alert-service/alert-services/base-alert-service-form';
import {
  OpsGenieServiceComponent,
} from 'app/pages/system/alert-service/alert-service/alert-services/ops-genie-service/ops-genie-service.component';
import { WebSocketService } from 'app/services/ws.service';

jest.mock('./alert-services/aws-sns-service/aws-sns-service.component', () => {
  return {
    AwsSnsServiceComponent: Component({
      selector: 'ix-aws-service',
      template: '',
    })(class {
      setValues = jest.fn() as BaseAlertServiceForm['setValues'];
      getSubmitAttributes = jest.fn(() => ({
        region: 'us-east-1',
        topic_arn: 'arn:aws:sns:us-east-1:123456789012:MyTopic',
        aws_access_key_id: 'KEY1',
        aws_secret_access_key: 'SECRET1',
      })) as BaseAlertServiceForm['getSubmitAttributes'];

      form = {
        get valid(): boolean {
          return true;
        },
      } as FormGroup;
    }),
  };
});

jest.mock('./alert-services/ops-genie-service/ops-genie-service.component', () => {
  return {
    OpsGenieServiceComponent: Component({
      selector: 'ix-ops-genie-service',
      template: '',
    })(class {
      setValues = jest.fn() as BaseAlertServiceForm['setValues'];
      getSubmitAttributes = jest.fn(() => ({
        email: 'me@truenas.com',
      })) as BaseAlertServiceForm['getSubmitAttributes'];

      form = {
        get valid(): boolean {
          return true;
        },
      } as FormGroup;
    }),
  };
});

describe('AlertServiceComponent', () => {
  let spectator: Spectator<AlertServiceComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;

  const existingService = {
    id: 4,
    name: 'Existing Service',
    enabled: true,
    type: AlertServiceType.AwsSns,
    level: AlertLevel.Warning,
    attributes: {
      region: 'us-east-1',
      topic_arn: 'arn:aws:sns:us-east-1:123456789012:MyTopic',
      aws_access_key_id: 'KEY1',
      aws_secret_access_key: 'SECRET1',
    } as AlertService['attributes'],
  } as AlertService;
  const createComponent = createComponentFactory({
    component: AlertServiceComponent,
    imports: [
      ReactiveFormsModule,
    ],
    declarations: [
      AwsSnsServiceComponent,
      OpsGenieServiceComponent,
    ],
    providers: [
      MockProvider(SlideInRef, {
        close: jest.fn(),
      }),
      { provide: SLIDE_IN_DATA, useValue: undefined },
      MockProvider(SnackbarService, {
        success: jest.fn(),
      }),
      MockProvider(DialogService, {
        info: jest.fn(),
      }),
      mockWebSocket([
        mockCall('alertservice.test', true),
        mockCall('alertservice.create'),
        mockCall('alertservice.update'),
      ]),
      mockAuth(),
    ],
  });

  describe('creates a new alert service', () => {
    beforeEach(async () => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
    });

    it('shows form fields specific to an alert service when Type is changed', async () => {
      await form.fillForm({
        Type: 'OpsGenie',
      });

      const opsGenieForm = spectator.query(OpsGenieServiceComponent);
      expect(opsGenieForm).toBeTruthy();
    });

    it('creates a new alert service when new form is submitted', async () => {
      await form.fillForm({
        Name: 'My Alert Service',
        Enabled: true,
        Type: 'AWS SNS',
        Level: 'Error',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      const awsSnsForm = spectator.query(AwsSnsServiceComponent);
      expect(awsSnsForm.getSubmitAttributes).toHaveBeenCalled();

      expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('alertservice.create', [{
        name: 'My Alert Service',
        enabled: true,
        type: AlertServiceType.AwsSns,
        level: AlertLevel.Error,
        attributes: {
          aws_access_key_id: 'KEY1',
          aws_secret_access_key: 'SECRET1',
          region: 'us-east-1',
          topic_arn: 'arn:aws:sns:us-east-1:123456789012:MyTopic',
        },
      }]);
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
      expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
    });

    it('sends a test alert when Send Test Alert is pressed and shows validation result', async () => {
      await form.fillForm({
        Name: 'My Alert Service',
        Enabled: true,
        Type: 'AWS SNS',
        Level: 'Error',
      });

      const sendTestAlertButton = await loader.getHarness(MatButtonHarness.with({ text: 'Send Test Alert' }));
      await sendTestAlertButton.click();

      const awsSnsForm = spectator.query(AwsSnsServiceComponent);
      expect(awsSnsForm.getSubmitAttributes).toHaveBeenCalled();
      expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('alertservice.test', [{
        attributes: {
          aws_access_key_id: 'KEY1',
          aws_secret_access_key: 'SECRET1',
          region: 'us-east-1',
          topic_arn: 'arn:aws:sns:us-east-1:123456789012:MyTopic',
        },
        enabled: true,
        level: AlertLevel.Error,
        name: 'My Alert Service',
        type: AlertServiceType.AwsSns,
      }]);

      expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
    });
  });

  describe('edits alert service', () => {
    beforeEach(async () => {
      spectator = createComponent({
        providers: [
          { provide: SLIDE_IN_DATA, useValue: existingService },
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
    });

    it('shows values for an existing alert service', fakeAsync(async () => {
      const values = await form.getValues();
      expect(values).toEqual({
        Enabled: true,
        Level: 'Warning',
        Name: 'Existing Service',
        Type: 'AWS SNS',
      });
      tick();

      const awsSnsForm = spectator.query(AwsSnsServiceComponent);
      expect(awsSnsForm.setValues).toHaveBeenCalledWith(existingService.attributes);
    }));

    it('updates an existing alert service when update form is submitted', async () => {
      await form.fillForm({
        Name: 'Updated Service',
        Enabled: false,
        Type: 'OpsGenie',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      const opsGenie = spectator.query(OpsGenieServiceComponent);
      expect(opsGenie.getSubmitAttributes).toHaveBeenCalled();

      expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('alertservice.update', [
        4,
        {
          name: 'Updated Service',
          enabled: false,
          level: AlertLevel.Warning,
          type: AlertServiceType.OpsGenie,
          attributes: { email: 'me@truenas.com' },
        },
      ]);
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
      expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
    });
  });
});
