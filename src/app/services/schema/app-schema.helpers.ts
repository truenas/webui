import { ChartSchemaNode } from 'app/interfaces/app.interface';

export function findAppSchemaNode(object: unknown, pathToField: string): ChartSchemaNode | undefined {
  const pathToFieldKeys = pathToField.split('.');
  let objectToSearchFrom = object;

  const appSchemaNode = pathToFieldKeys.map((key) => {
    const schemaFound = findAppSchemaObjectToStartSearchFrom(objectToSearchFrom, key);
    if (schemaFound) {
      objectToSearchFrom = schemaFound;
    }
    return schemaFound;
  });

  return appSchemaNode.pop();
}

function findAppSchemaObjectToStartSearchFrom(object: unknown, variableName: string): ChartSchemaNode | undefined {
  const typedObject = object as Record<string, unknown>;
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
