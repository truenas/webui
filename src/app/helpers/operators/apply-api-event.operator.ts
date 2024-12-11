import { OperatorFunction, map } from 'rxjs';
import { CollectionChangeType } from 'app/enums/api.enum';
import { ApiCallAndSubscribeMethod, ApiCallAndSubscribeResponse } from 'app/interfaces/api/api-call-and-subscribe-directory.interface';
import { ApiCallResponse } from 'app/interfaces/api/api-call-directory.interface';
import { ApiEventTyped } from 'app/interfaces/api-message.interface';

export function applyApiEvent<
  M extends ApiCallAndSubscribeMethod,
>(): OperatorFunction<[ApiCallResponse<M>, ApiEventTyped<M>], ApiCallAndSubscribeResponse<M>[]> {
  return map(([items, event]) => {
    switch (event?.msg) {
      case CollectionChangeType.Added:
        return [...items, event.fields];
      case CollectionChangeType.Changed:
        return items.map((item) => (item.id === event.id ? event.fields : item));
      case CollectionChangeType.Removed:
        return items.filter((item) => item.id !== event.id);
      default:
        break;
    }
    return items;
  });
}
