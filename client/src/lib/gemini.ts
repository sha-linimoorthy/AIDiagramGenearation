import { type GanttChartData, ganttChartDataSchema } from '@shared/schema';
import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000';

/**
 * Calls the backend API to generate a chart using the local Ollama backend
 * @param prompt The user prompt describing the chart
 * @param chartType The type of chart to generate (e.g., 'gantt')
 * @returns The parsed chart data
 */
export async function generateChart(
  prompt: string,
  chartType: string
): Promise<GanttChartData> {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/generate-chart`, {
      prompt,
      chartType
    });
    
    return ganttChartDataSchema.parse(response.data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.detail || 'Failed to generate chart data');
    }
    throw new Error('Failed to generate chart data');
  }
}

/**
 * Save a chart to the database
 * @param chart The chart data to save
 * @returns The saved chart with ID
 */
export async function saveChart(chart: GanttChartData): Promise<any> {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/charts`, {
      title: chart.title,
      type: 'gantt',
      data: chart
    });
    
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.detail || 'Failed to save chart');
    }
    throw new Error('Failed to save chart');
  }
}

/**
 * Get all saved charts
 * @returns Array of saved charts
 */
export async function getCharts(): Promise<any[]> {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/charts`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.detail || 'Failed to fetch charts');
    }
    throw new Error('Failed to fetch charts');
  }
}

/**
 * Get a specific chart by ID
 * @param id The chart ID
 * @returns The chart data
 */
export async function getChartById(id: string): Promise<any> {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/charts/${id}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.detail || 'Failed to fetch chart');
    }
    throw new Error('Failed to fetch chart');
  }
}