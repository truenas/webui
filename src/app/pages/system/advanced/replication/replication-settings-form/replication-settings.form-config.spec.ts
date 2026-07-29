import { TranslateService } from '@ngx-translate/core';
import { ReplicationConfig } from 'app/interfaces/replication-config.interface';
import { FormSubmitEvent } from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  getReplicationSettingsFormConfig,
} from 'app/pages/system/advanced/replication/replication-settings-form/replication-settings.form-config';

describe('getReplicationSettingsFormConfig', () => {
  const api = { call: jest.fn(() => undefined) } as unknown as ApiService;
  const translate = { instant: (key: string) => key } as TranslateService;

  beforeEach(() => jest.clearAllMocks());

  it('builds an update request with the entered task limit', () => {
    const allValues = { max_parallel_replication_tasks: 5 } as ReplicationConfig;
    const definition = getReplicationSettingsFormConfig(api, translate);
    definition.submit({ isEdit: true, allValues, changedValues: allValues } as FormSubmitEvent<ReplicationConfig>);

    expect(api.call).toHaveBeenCalledWith('replication.config.update', [
      { max_parallel_replication_tasks: 5 },
    ]);
  });

  it('sends null when the task limit is not a positive number', () => {
    const allValues = { max_parallel_replication_tasks: 0 } as ReplicationConfig;
    const definition = getReplicationSettingsFormConfig(api, translate);
    definition.submit({ isEdit: true, allValues, changedValues: allValues } as FormSubmitEvent<ReplicationConfig>);

    expect(api.call).toHaveBeenCalledWith('replication.config.update', [
      { max_parallel_replication_tasks: null },
    ]);
  });
});
