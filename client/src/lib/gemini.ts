import { type GanttChartData, ganttChartDataSchema } from '@shared/schema';

/**
 * Interface for the response from the Gemini API
 */
interface GeminiGenerateContentResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

/**
 * Calls the backend API to generate a chart using Gemini AI
 * @param prompt The user prompt describing the chart
 * @param chartType The type of chart to generate (e.g., 'gantt')
 * @returns The parsed chart data
 */
export async function generateChartWithGemini(
  prompt: string,
  chartType: string
): Promise<GanttChartData> {
  const response = await fetch('/api/generate-chart', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt, chartType }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to generate chart data');
  }

  const data = await response.json();
  return ganttChartDataSchema.parse(data);
}

/**
 * Save a chart to the database
 * @param chart The chart data to save
 * @returns The saved chart with ID
 */
export async function saveChart(chart: GanttChartData): Promise<any> {
  const response = await fetch('/api/charts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: chart.title,
      type: 'gantt',
      data: chart
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to save chart');
  }

  return await response.json();
}
