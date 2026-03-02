import {
  Color, DoughnutController, elements, registry,
} from 'chart.js';

class RoundedDoughnutController extends DoughnutController {
  static override readonly id = 'roundedDoughnut';
  override draw(): void {
    const ctx = this.chart.ctx;
    const meta = this.getMeta();
    const lastVisibleIndex = meta.data.length - 2;

    let previousColor: Color;

    (meta.data as elements.ArcElement[]).forEach((chartElem, index) => {
      if (index > lastVisibleIndex) {
        return;
      }

      chartElem.draw(ctx);

      const {
        innerRadius, outerRadius, startAngle, endAngle,
        x: xNullable, y: yNullable,
      } = chartElem.getProps(['innerRadius', 'outerRadius', 'startAngle', 'endAngle', 'x', 'y']);
      const x = xNullable ?? 0;
      const y = yNullable ?? 0;
      const radius = (outerRadius + innerRadius) / 2;
      const thickness = (outerRadius - innerRadius) / 2;
      const startCapAngle = Math.PI / 2 - startAngle;
      const endCapAngle = Math.PI / 2 - endAngle;

      ctx.save();

      if (index === 0) {
        ctx.fillStyle = chartElem.options.backgroundColor;
        ctx.translate(x, y);
        ctx.beginPath();
        ctx.arc(
          radius * Math.sin(startCapAngle),
          radius * Math.cos(startCapAngle),
          0.9 * thickness,
          0,
          2 * Math.PI,
        );
        ctx.closePath();
        ctx.translate(-x, -y);
        ctx.fill();
      }

      if (index > 0) {
        ctx.fillStyle = previousColor;
        ctx.translate(x, y);
        ctx.beginPath();
        ctx.arc(
          radius * Math.sin(startCapAngle),
          radius * Math.cos(startCapAngle),
          0.9 * thickness,
          0,
          2 * Math.PI,
        );
        ctx.closePath();
        ctx.translate(-x, -y);
        ctx.fill();
      }

      if (index === lastVisibleIndex) {
        ctx.fillStyle = chartElem.options.backgroundColor;
        ctx.translate(x, y);
        ctx.beginPath();
        ctx.arc(
          radius * Math.sin(endCapAngle),
          radius * Math.cos(endCapAngle),
          0.9 * thickness,
          0,
          2 * Math.PI,
        );
        ctx.closePath();
        ctx.translate(-x, -y);
        ctx.fill();

        ctx.fillStyle = '#0000';
        ctx.beginPath();
        ctx.arc(x, y, radius - 2.2 * thickness, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#0000';
        ctx.beginPath();
        ctx.arc(x, y, radius - 3.2 * thickness, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.fill();
      }

      previousColor = chartElem.options.backgroundColor;
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
