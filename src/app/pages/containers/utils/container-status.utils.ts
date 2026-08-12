import { ContainerStatus } from 'app/enums/container.enum';
import { Container } from 'app/interfaces/container.interface';

/**
 * Middleware treats anything other than STOPPED as active: renaming, deleting without
 * `force` and device operations are all refused for a container that is not stopped.
 * SUSPENDED is only reached out of band (a libvirt I/O-error pause or `virsh suspend`),
 * so it must never be mistaken for "stopped".
 */
export function isContainerStopped(container: Container | null | undefined): boolean {
  return container?.status?.state === ContainerStatus.Stopped;
}

export function isContainerActive(container: Container | null | undefined): boolean {
  const state = container?.status?.state;

  return state === ContainerStatus.Running || state === ContainerStatus.Suspended;
}

/**
 * Stricter than {@link isContainerActive}: only a RUNNING container has a live init process,
 * so this is what things that talk to the workload itself (the shell, live metrics) need.
 */
export function isContainerRunning(container: Container | null | undefined): boolean {
  return container?.status?.state === ContainerStatus.Running;
}
