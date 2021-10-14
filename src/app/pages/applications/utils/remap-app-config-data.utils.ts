import {
  FieldConfig,
  FormDictConfig,
  FormListConfig,
} from 'app/pages/common/entity/entity-form/models/field-config.interface';

export function remapAppConfigData(data: any, fieldConfigs: FieldConfig[]): any {
  const result = {} as any;
  for (const key in data) {
    const value = data[key];
    const fieldConfig = fieldConfigs.find((fg) => fg.name === key);
    const newValue = remapOneConfigData(value, fieldConfig);
    result[key] = newValue;
  }
  return result;
}

function remapOneConfigData(data: any, fieldConfig: FieldConfig): any {
  let result;
  if (!fieldConfig || data === undefined || data === null || data === '') {
    result = data;
  } else if (Array.isArray(data)) {
    result = [];
    data.forEach((item) => {
      const listConfig = fieldConfig as FormListConfig;
      let value = item;
      const subFieldConfig = listConfig.templateListField[0];
      if (subFieldConfig.type === 'dict') {
        value = remapOneConfigData(item, subFieldConfig);
      }
      result.push({
        [subFieldConfig.name]: value,
      });
    });
  } else if (typeof data === 'object') {
    result = {} as any;
    for (const key in data) {
      const dictConfig = fieldConfig as FormDictConfig;
      const subValue = data[key];
      const subFieldConfig = dictConfig.subFields.find((fg) => fg.name === key);
      const newValue = remapOneConfigData(subValue, subFieldConfig);
      result[key] = newValue;
    }
  } else {
    result = data;
  }

  return result;
}
