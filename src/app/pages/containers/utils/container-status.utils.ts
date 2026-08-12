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

/**
 * Derived from the negation rather than enumerating RUNNING/SUSPENDED, so that the two
 * helpers partition every reported state. UNKNOWN counts as active: middleware could not
 * confirm the container is down, so an operation that requires "stopped" is refused there
 * too, and blocking it with an explanation beats a raw refusal at submit time.
 */
export function isContainerActive(container: Container | null | undefined): boolean {
  return Boolean(container?.status?.state) && !isContainerStopped(container);
}

/**
 * Stricter than {@link isContainerActive}: only a RUNNING container has a live init process,
 * so this is what things that talk to the workload itself (the shell, live metrics) need.
 */
export function isContainerRunning(container: Container | null | undefined): boolean {
  return container?.status?.state === ContainerStatus.Running;
}
