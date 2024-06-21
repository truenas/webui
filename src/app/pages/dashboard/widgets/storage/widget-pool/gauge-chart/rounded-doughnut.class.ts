import {
  Color, DoughnutController, elements, registry,
} from 'chart.js';

class RoundedDoughnutController extends DoughnutController {
  static override readonly id = 'roundedDoughnut';
  override draw(): void {
    const ctx = this.chart.ctx;
    const meta = this.getMeta();

    let tempBackgroundColor: Color;

    (meta.data as elements.ArcElement[]).forEach((chartElem, index) => {
      if (index === 2) {
        return;
      }

      chartElem.draw(ctx);

      const view = chartElem.getProps(['innerRadius', 'outerRadius', 'startAngle', 'endAngle', 'x', 'y']);
      const radius = (view.outerRadius + view.innerRadius) / 2;
      const thickness = (view.outerRadius - view.innerRadius) / 2;
      const angle = Math.PI / 2 - view.startAngle;
      const angle2 = Math.PI / 2 - view.endAngle;

      ctx.save();

      if (index === 0) {
        tempBackgroundColor = chartElem.options.backgroundColor;
      }

      if (index === 0) {
        ctx.fillStyle = chartElem.options.backgroundColor;
        ctx.translate(view.x, view.y);
        ctx.beginPath();
        ctx.arc(
          radius * Math.sin(angle),
          radius * Math.cos(angle),
          0.9 * thickness,
          0,
          2 * Math.PI,
        );
        ctx.closePath();
        ctx.translate(-view.x, -view.y);
        ctx.fill();
      }
      if (index === 1) {
        ctx.fillStyle = chartElem.options.backgroundColor;
        ctx.translate(view.x, view.y);
        ctx.beginPath();
        ctx.arc(
          radius * Math.sin(angle2),
          radius * Math.cos(angle2),
          0.9 * thickness,
          0,
          2 * Math.PI,
        );
        ctx.closePath();
        ctx.translate(-view.x, -view.y);
        ctx.fill();
      }

      if (index === 1) {
        ctx.fillStyle = tempBackgroundColor;
        ctx.translate(view.x, view.y);
        ctx.beginPath();
        ctx.arc(
          radius * Math.sin(angle),
          radius * Math.cos(angle),
          0.9 * thickness,
          0,
          2 * Math.PI,
        );
        ctx.closePath();
        ctx.translate(-view.x, -view.y);
        ctx.fill();

        ctx.fillStyle = '#0000';
        ctx.beginPath();
        ctx.arc(view.x, view.y, radius - 2.2 * thickness, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#0000';
        ctx.beginPath();
        ctx.arc(view.x, view.y, radius - 3.2 * thickness, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    });
  }
}

registry.addControllers(RoundedDoughnutController);

declare module 'chart.js' {
  interface ChartTypeRegistry {
    roundedDoughnut: ChartTypeRegistry['doughnut'];
  }
}
