import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateService } from '@ngx-translate/core';
import { Role } from 'app/enums/role.enum';
import { helptextSystemAdvanced } from 'app/helptext/system/advanced';
import { ReplicationConfig } from 'app/interfaces/replication-config.interface';
import { FormDefinition } from 'app/modules/forms/ix-forms/components/ix-form-renderer/form-definition.interface';
import { ApiService } from 'app/modules/websocket/api.service';

export function getReplicationSettingsFormConfig(
  api: ApiService,
  translate: TranslateService,
): FormDefinition<ReplicationConfig> {
  return {
    title: T('Replication'),
    requiredRoles: [Role.ReplicationTaskConfigWrite],
    fields: [
      {
        name: 'max_parallel_replication_tasks',
        type: 'input',
        inputType: 'number',
        label: T('Replication Tasks Limit'),
        tooltip: helptextSystemAdvanced.maxParallelReplicationTasksTooltip,
      },
    ],
    submit: (event) => {
      const maxTasks = event.allValues.max_parallel_replication_tasks;
      const replicationConfigUpdate = {
        max_parallel_replication_tasks: maxTasks && maxTasks > 0 ? maxTasks : null,
      };
      return {
        request$: api.call('replication.config.update', [replicationConfigUpdate]),
        successMessage: translate.instant('Settings saved'),
      };
    },
  };
}
