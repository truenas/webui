import { ChartSchemaNode } from 'app/interfaces/chart-release.interface';

export function findSchemaNode(object: unknown, variableName: string): ChartSchemaNode | undefined {
  const typedObject = object as { [key: string]: unknown };
  let value;

  if (typedObject) {
    Object?.keys(typedObject)?.some((objectKey) => {
      if (typedObject.variable === variableName) {
        value = typedObject;
        return true;
      }
      if (typedObject[objectKey] && typeof typedObject[objectKey] === 'object') {
        value = findSchemaNode(typedObject[objectKey], variableName);
        return value !== undefined;
      }
      return false;
    });
  }

  return value;
}
