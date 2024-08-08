import { UsedPort } from 'app/interfaces/app.interface';

export function getPorts(ports: UsedPort[]): string {
  return ports.map((item) => {
    return `${item.port}\\${item.protocol}`;
  }).join(', ');
}
