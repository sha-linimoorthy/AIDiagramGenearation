import { BarChartData, ChartData, GanttChartData, PieChartData } from '@shared/schema';
import GanttChart from './gantt-chart';
import BarChart from './bar-chart';
import PieChart from './pie-chart';
import LineChart from './line-chart';
import FlowChart from './flow-chart';

interface ChartRendererProps {
  data: ChartData | null;
  chartType: string | null;
}

const ChartRenderer = ({ data, chartType }: ChartRendererProps) => {
  if (!data || !chartType) {
    return <div className="flex items-center justify-center h-64 border rounded-lg text-gray-500">
      No chart data available. Generate a chart to see it here.
    </div>;
  }

  // Render the appropriate chart based on the type
  switch (chartType) {
    case 'gantt':
      return <GanttChart data={data as GanttChartData} />;
    case 'bar':
      return <BarChart data={data as BarChartData} />;
    case 'pie':
      return <PieChart data={data as PieChartData} />;
    case 'line':
      return <LineChart data={data as BarChartData} />;
    case 'flow':
      return <FlowChart data={data as any} />;
    default:
      return <div className="flex items-center justify-center h-64 border rounded-lg text-red-500">
        Unsupported chart type: {chartType}
      </div>;
  }
};

export default ChartRenderer;