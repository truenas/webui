import { ChartSchemaNode } from 'app/interfaces/chart-release.interface';

export function findAppSchemaNode(object: unknown, pathToField: string): ChartSchemaNode | undefined {
  const items = pathToField.split('.');
  let objectToSearchFrom = object;

  const finalResult = items.map((key) => {
    const schemaFound = findAppSchemaObjectToStartSearchFrom(objectToSearchFrom, key);
    if (schemaFound) {
      objectToSearchFrom = schemaFound;
    }

    return schemaFound;
  });

  return finalResult.pop();
}

function findAppSchemaObjectToStartSearchFrom(object: unknown, variableName: string): ChartSchemaNode | undefined {
  const typedObject = object as { [key: string]: unknown };
  let value;

  if (typedObject) {
    Object?.keys(typedObject)?.some((objectKey) => {
      if (typedObject.variable === variableName) {
        value = typedObject;
        return true;
      }
      if (typedObject[objectKey] && typeof typedObject[objectKey] === 'object') {
        value = findAppSchemaNode(typedObject[objectKey], variableName);
        return value !== undefined;
      }
      return false;
    });
  }

  return value;
}
