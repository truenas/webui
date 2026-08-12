import { ContainerStatus } from 'app/enums/container.enum';
import { isContainerActive, isContainerStopped } from 'app/pages/containers/utils/container-status.utils';
import { fakeContainer } from 'app/pages/containers/utils/fake-container.utils';

function containerIn(state: ContainerStatus): ReturnType<typeof fakeContainer> {
  return fakeContainer({ status: { state, pid: null, domain_state: null } });
}

describe('container status utils', () => {
  describe('isContainerStopped', () => {
    it('is true only for STOPPED', () => {
      expect(isContainerStopped(containerIn(ContainerStatus.Stopped))).toBe(true);
      expect(isContainerStopped(containerIn(ContainerStatus.Running))).toBe(false);
      expect(isContainerStopped(containerIn(ContainerStatus.Suspended))).toBe(false);
    });

    it('is false when there is no container or status', () => {
      expect(isContainerStopped(null)).toBe(false);
      expect(isContainerStopped(undefined)).toBe(false);
    });
  });

  describe('isContainerActive', () => {
    it('treats everything other than STOPPED as active, matching middleware', () => {
      expect(isContainerActive(containerIn(ContainerStatus.Suspended))).toBe(true);
      expect(isContainerActive(containerIn(ContainerStatus.Running))).toBe(true);
      expect(isContainerActive(containerIn(ContainerStatus.Unknown))).toBe(true);
      expect(isContainerActive(containerIn(ContainerStatus.Stopped))).toBe(false);
    });

    it('is false when there is no container or status', () => {
      expect(isContainerActive(null)).toBe(false);
      expect(isContainerActive(undefined)).toBe(false);
    });
  });
});
