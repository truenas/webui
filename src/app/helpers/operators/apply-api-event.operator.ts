import { OperatorFunction, map } from 'rxjs';
import { CollectionChangeType } from 'app/enums/api.enum';
import { ApiEvent } from 'app/interfaces/api-message.interface';

/**
 * Applies a collection event to the rows it belongs to. The event is not typed by collection,
 * so its `fields` are taken to be a row.
 */
export function applyApiEvent<T extends { id: unknown }>(): OperatorFunction<[T[], ApiEvent | null], T[]> {
  return map(([items, event]) => {
    switch (event?.msg) {
      case CollectionChangeType.Added:
        return [...items, event.fields as T];
      case CollectionChangeType.Changed:
        return items.map((item) => (item.id === event.id ? event.fields as T : item));
      case CollectionChangeType.Removed:
        return items.filter((item) => item.id !== event.id);
      default:
        break;
    }
    return items;
  });
}
