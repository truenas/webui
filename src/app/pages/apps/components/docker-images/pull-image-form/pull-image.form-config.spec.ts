import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormSubmitEvent } from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  getPullImageFormConfig,
  PullImageFormValues,
} from 'app/pages/apps/components/docker-images/pull-image-form/pull-image.form-config';

describe('getPullImageFormConfig', () => {
  const allValues = {
    image: 'private/redis',
    tag: 'stable',
    username: 'john',
    password: '12345678',
  } as PullImageFormValues;

  const api = { job: jest.fn(() => of(undefined)) } as unknown as ApiService;
  const translate = { instant: (key: string) => key } as TranslateService;
  const dialogService = {
    jobDialog: jest.fn(() => ({ afterClosed: () => of(null) })),
  } as unknown as DialogService;

  beforeEach(() => jest.clearAllMocks());

  it('pulls the docker image with auth config when the form is submitted', () => {
    const definition = getPullImageFormConfig(api, translate, dialogService);
    definition.submit({
      isEdit: false,
      allValues,
      changedValues: allValues,
    } as FormSubmitEvent<PullImageFormValues>);

    expect(api.job).toHaveBeenCalledWith('app.image.pull', [{
      auth_config: {
        username: 'john',
        password: '12345678',
      },
      image: 'private/redis:stable',
    }]);
  });
});
