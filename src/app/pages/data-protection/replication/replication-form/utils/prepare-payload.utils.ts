import _ from 'lodash';
import { CompressionType } from 'app/enums/compression-type.enum';
import { LoggingLevel } from 'app/enums/logging-level.enum';
import { SnapshotNamingOption } from 'app/enums/snapshot-naming-option.enum';
import { ReplicationCreate } from 'app/interfaces/replication-task.interface';
import { crontabToSchedule } from 'app/modules/scheduler/utils/crontab-to-schedule.utils';
import {
  ReplicationFormComponent,
} from 'app/pages/data-protection/replication/replication-form/replication-form.component';

type FormValues = ReplicationFormComponent['form']['value'];

export function test(values: FormValues): ReplicationCreate {
  const payloadBuilder = new ReplicationPayloadBuilder(values);
  payloadBuilder
    .addBaseFields()
    .addSchedule()
    .addPropertiesOverride();

  return payloadBuilder.toPayload();
}

export function preparePayload(values: FormValues): ReplicationCreate {
  const baseFields = getBaseFields(values);
  addRestrictSchedule(
    addPropertiesOverride(
      addSchedule(baseFields, values),
      values,
    ),
    values,
  );

  const curriedAddSchedule = _.curry(addSchedule);
  curriedAddSchedule(values)(payload);

  const preparePayload = _.flow(
    _.curry(addSchedule, values),
    _.curry(addPropertiesOverride, values),
    addRestrictSchedule,
  );

  preparePayload(values);

  return [
    addSchedule,
    addPropertiesOverride,
    addRestrictSchedule,
    addSnapshotFields,
  ].reduce((payload, fn) => fn(payload, values), baseFields);
}

function getBaseFields(values: FormValues): ReplicationCreate {
  return {
    ..._.pick(values, [
      'name',
      'direction',
      'transport',
      'retries',
      'enabled',
      'large_block',
      'compressed',
      'recursive',
      'properties',
      'replicate',
      'properties_exclude',
      'readonly',
      'encryption',
      'retention_policy',
      'auto',
      'target_dataset',
    ]),
    source_datasets: Array.isArray(values.source_datasets)
      ? values.source_datasets as string[]
      : [values.source_datasets],
    compression: values.compression === CompressionType.Disabled ? null : values.compression,
    logging_level: values.logging_level === LoggingLevel.Default ? null : values.logging_level,
  } as ReplicationCreate;
}

function addSchedule(payload: ReplicationCreate, values: FormValues): ReplicationCreate {
  if (!values.schedule) {
    return payload;
  }

  return {
    ...payload,
    schedule: {
      ...crontabToSchedule(values.schedule_picker),
      begin: values.schedule_begin,
      end: values.schedule_end,
    },
  };
}

function addRestrictSchedule(payload: ReplicationCreate, values: FormValues): ReplicationCreate {
  if (!values.restrict_schedule) {
    return payload;
  }

  return {
    ...payload,
    restrict_schedule: {
      ...crontabToSchedule(values.restrict_schedule_picker),
      begin: values.restrict_schedule_begin,
      end: values.restrict_schedule_end,
    },
  };
}

function addSnapshotFields(payload: ReplicationCreate, values: FormValues): ReplicationCreate {
  const snapshotFields = values.schema_or_regex === SnapshotNamingOption.NamingSchema
    ? {
      naming_schema: values.naming_schema,
      also_include_naming_schema: values.also_include_naming_schema,
    }
    : {
      name_regex: values.name_regex,
    };

  return {
    ...payload,
    ...snapshotFields,
  };
}

function addPropertiesOverride(payload: ReplicationCreate, values: FormValues): ReplicationCreate {
  const propertiesOverride = (values.properties_override).reduce((overrides, property) => {
    const [key, value] = property.split('=');
    overrides[key] = value;
    return overrides;
  }, {} as ReplicationCreate['properties_override']);

  return {
    ...payload,
    properties_override: propertiesOverride,
  };
}
