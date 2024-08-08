import { AppUsedPort } from 'app/interfaces/app.interface';

export function getPorts(ports: AppUsedPort[]): string {
  return ports.map((item) => {
    return `${item.container_port}\\${item.protocol}`;
  }).join(', ');
}
