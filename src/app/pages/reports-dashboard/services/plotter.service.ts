import { Injectable } from '@angular/core';

@Injectable()
export abstract class PlotterService {
  abstract getSmoothPlotter(): unknown;
}
