import { SnapshotAction, SnapshotActionType } from 'app/store/actions/storage-snapshot.actions';
import { SnapshotState, snapshotAdapter, initialSnapshotState } from 'app/store/states/storage-snapshot.state';

export function snapshotReducer(state = initialSnapshotState, action: SnapshotAction): SnapshotState {
  switch (action.type) {
    case SnapshotActionType.Loading: {
      return { ...state, loading: true };
    }
    case SnapshotActionType.LoadSuccess: {
      return snapshotAdapter.setAll(action.payload, {
        ...state,
        error: false,
        loading: false,
        total: action.payload.length,
      });
    }
    case SnapshotActionType.LoadFailure: {
      return snapshotAdapter.removeAll({
        ...state,
        error: true,
        loading: false,
        total: 0,
      });
    }
    default:
      return state;
  }
}
