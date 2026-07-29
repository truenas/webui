import { TranslateService } from '@ngx-translate/core';
import { IscsiAuthMethod } from 'app/enums/iscsi.enum';
import { IscsiAuthAccess } from 'app/interfaces/iscsi.interface';
import { FormSubmitEvent } from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  AuthorizedAccessFormValues,
  getAuthorizedAccessFormConfig,
} from 'app/pages/sharing/iscsi/authorized-access/authorized-access-form/authorized-access.form-config';

describe('getAuthorizedAccessFormConfig', () => {
  const mutualValues = {
    tag: 113,
    user: 'new-user',
    secret: '123456789012',
    secret_confirm: '123456789012',
    peeruser: 'new-peer',
    peersecret: 'peer123456789012',
    peersecret_confirm: 'peer123456789012',
    discovery_auth: IscsiAuthMethod.ChapMutual,
  } as AuthorizedAccessFormValues;

  const noneValues = {
    ...mutualValues,
    peeruser: 'new-peer',
    peersecret: 'peer123456789012',
    discovery_auth: IscsiAuthMethod.None,
  } as AuthorizedAccessFormValues;

  const api = { call: jest.fn(() => undefined) } as unknown as ApiService;
  const translate = { instant: (key: string) => key } as TranslateService;

  beforeEach(() => jest.clearAllMocks());

  it('builds a create request with peer credentials for Mutual CHAP', () => {
    const definition = getAuthorizedAccessFormConfig(api, translate, undefined);
    definition.submit({
      isEdit: false, allValues: mutualValues, changedValues: mutualValues,
    } as FormSubmitEvent<AuthorizedAccessFormValues>);

    expect(api.call).toHaveBeenCalledWith('iscsi.auth.create', [{
      tag: 113,
      user: 'new-user',
      secret: '123456789012',
      peeruser: 'new-peer',
      peersecret: 'peer123456789012',
      discovery_auth: IscsiAuthMethod.ChapMutual,
    }]);
  });

  it('clears peer credentials in the create request when auth is not Mutual CHAP', () => {
    const definition = getAuthorizedAccessFormConfig(api, translate, undefined);
    definition.submit({
      isEdit: false, allValues: noneValues, changedValues: noneValues,
    } as FormSubmitEvent<AuthorizedAccessFormValues>);

    expect(api.call).toHaveBeenCalledWith('iscsi.auth.create', [{
      tag: 113,
      user: 'new-user',
      secret: '123456789012',
      peeruser: '',
      peersecret: '',
      discovery_auth: IscsiAuthMethod.None,
    }]);
  });

  it('builds an update request scoped to the edited access id', () => {
    const definition = getAuthorizedAccessFormConfig(api, translate, { id: 123 } as IscsiAuthAccess);
    definition.submit({
      isEdit: true, allValues: mutualValues, changedValues: mutualValues,
    } as FormSubmitEvent<AuthorizedAccessFormValues>);

    expect(api.call).toHaveBeenCalledWith('iscsi.auth.update', [123, {
      tag: 113,
      user: 'new-user',
      secret: '123456789012',
      peeruser: 'new-peer',
      peersecret: 'peer123456789012',
      discovery_auth: IscsiAuthMethod.ChapMutual,
    }]);
  });
});
