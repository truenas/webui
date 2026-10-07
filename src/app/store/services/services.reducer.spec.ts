import { ServiceName } from 'app/enums/service-name.enum';
import { Service } from 'app/interfaces/service.interface';
import { servicesLoaded } from 'app/store/services/services.actions';
import { initialState, servicesReducer } from 'app/store/services/services.reducer';

describe('servicesReducer', () => {
  it('stores loaded services by id, sorted by their display name', () => {
    const services = [
      { id: 2, service: ServiceName.Ssh },
      { id: 1, service: ServiceName.Cifs },
    ] as Service[];

    const state = servicesReducer(initialState, servicesLoaded({ services }));

    expect(state.areLoaded).toBe(true);
    expect(state.ids).toEqual([1, 2]);
    expect(state.entities[2]).toEqual(services[0]);
  });
});
