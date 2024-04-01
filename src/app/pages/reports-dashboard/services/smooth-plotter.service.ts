import { Injectable } from '@angular/core';
// eslint-disable-next-line import/extensions
import smoothPlotter from 'dygraphs/src/extras/smooth-plotter.js';
import { PlotterService } from 'app/pages/reports-dashboard/services/plotter.service';

@Injectable()
export class SmoothPlotterService extends PlotterService {
  getSmoothPlotter(): typeof smoothPlotter {
    return smoothPlotter;
  }
}
