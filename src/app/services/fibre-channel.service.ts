import { Injectable, inject } from '@angular/core';
import {
  forkJoin, map, Observable, of, switchMap,
} from 'rxjs';
import { FcPortFormValue, FibreChannelPort } from 'app/interfaces/fibre-channel.interface';
import { ApiService } from 'app/modules/websocket/api.service';

@Injectable({ providedIn: 'root' })
export class FibreChannelService {
  private api = inject(ApiService);


  /**
   * Load all FC ports associated with a target.
   * @param targetId Target ID.
   * @returns Observable of FibreChannelPort array.
   */
  loadTargetPorts(targetId: number): Observable<FibreChannelPort[]> {
    return this.api.call('fcport.query', [[['target.id', '=', targetId]]]);
  }

  /**
   * Validates that all ports in the array use different physical HBAs.
   * @param ports Array of port form values to validate.
   * @returns Validation result with list of duplicate HBAs if any.
   */
  validatePhysicalHbaUniqueness(ports: FcPortFormValue[]): { valid: boolean; duplicates: string[] } {
    const physicalHbas = new Set<string>();
    const duplicates = new Set<string>();

    ports.forEach((portForm) => {
      const portString = portForm.port;
      if (!portString) {
        return;
      }

      // Extract physical HBA: split on '/' and take first part
      // Example: "fc0/1" → "fc0", "fc1" → "fc1"
      const physicalHba = portString.split('/')[0];

      if (physicalHbas.has(physicalHba)) {
        duplicates.add(physicalHba);
      } else {
        physicalHbas.add(physicalHba);
      }
    });

    return {
      valid: duplicates.size === 0,
      duplicates: Array.from(duplicates),
    };
  }

  /**
   * Links multiple FC ports to a target for MPIO support.
   * Compares desired ports with existing ports and performs create/delete operations as needed.
   * @param targetId Target ID.
   * @param desiredPorts Array of port form values (port string or host_id for virtual port creation).
   * @returns Observable that completes when all port operations are done.
   */
  linkFiberChannelPortsToTarget(
    targetId: number,
    desiredPorts: FcPortFormValue[],
  ): Observable<unknown> {
    return this.loadTargetPorts(targetId).pipe(
      switchMap((existingPorts) => {
        const operations: Observable<unknown>[] = [];

        // Build map of existing ports by port string
        const existingMap = new Map(
          existingPorts.map((port) => [port.port, port.id]),
        );

        // Resolve desired ports (handle host_id → port string conversion)
        const resolvedPorts$ = forkJoin(
          desiredPorts.length > 0
            ? desiredPorts.map((portForm) => (
                portForm.host_id ? this.createNewPort(portForm.host_id) : of(portForm.port)
              ))
            : [of(null)],
        );

        return resolvedPorts$.pipe(
          switchMap((resolvedPorts) => {
            const desiredSet = new Set(resolvedPorts.filter((portString) => portString !== null) as string[]);

            // Delete ports that are no longer desired
            existingPorts.forEach((existing) => {
              if (!desiredSet.has(existing.port)) {
                operations.push(
                  this.api.call('fcport.delete', [existing.id]),
                );
              }
            });

            // Create new ports
            resolvedPorts.forEach((port) => {
              if (port && !existingMap.has(port)) {
                operations.push(
                  this.api.call('fcport.create', [{
                    port,
                    target_id: targetId,
                  }]),
                );
              }
            });

            // If no operations, return success
            if (operations.length === 0) {
              return of(true);
            }

            return forkJoin(operations);
          }),
        );
      }),
    );
  }

  private createNewPort(hostId: number): Observable<string> {
    return this.api.call('fc.fc_host.query', [[['id', '=', hostId]]]).pipe(
      switchMap((hosts) => {
        const host = hosts[0];
        return this.api.call('fc.fc_host.update', [host.id, { npiv: host.npiv + 1 }]).pipe(
          map(() => `${host.alias}/${host.npiv + 1}`),
        );
      }),
    );
  }
}
