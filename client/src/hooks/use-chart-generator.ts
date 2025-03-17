import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { type ChartData, type GanttChartData, type BarChartData, type PieChartData } from '@shared/schema';
import { generateChartCode } from '@/lib/chart-utils';

interface ChartGeneratorResult {
  generateChart: (prompt: string, chartType: string) => Promise<void>;
  chartData: ChartData | null;
  chartType: string | null;
  chartCode: string | null;
  isLoading: boolean;
  error: string | null;
}

export function useChartGenerator(): ChartGeneratorResult {
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [chartType, setChartType] = useState<string | null>(null);
  const [chartCode, setChartCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const generateChartMutation = useMutation({
    mutationFn: async ({ prompt, chartType }: { prompt: string, chartType: string }) => {
      const response = await apiRequest('POST', '/api/generate-chart', { prompt, chartType });
      return { data: await response.json(), type: chartType };
    },
    onSuccess: (result: { data: ChartData, type: string }) => {
      const { data, type } = result;
      console.log(`${type} chart data received:`, data);
      setChartData(data);
      setChartType(type);
      setError(null);
      
      let successMessage = `Generated "${data.title}"`;
      
      // Add specific details based on chart type
      if (type === 'gantt' && 'tasks' in data) {
        successMessage += ` with ${(data as GanttChartData).tasks.length} tasks`;
      } else if ((type === 'bar' || type === 'pie') && 'data' in data) {
        const dataPoints = (type === 'bar') 
          ? (data as BarChartData).data.length 
          : (data as PieChartData).data.length;
        successMessage += ` with ${dataPoints} data points`;
      }
      
      toast({
        title: "Chart generated successfully",
        description: successMessage,
      });
    },
    onError: (error: Error) => {
      console.error("Chart generation error:", error);
      setChartData(null);
      setChartType(null);
      setError(error.message || "Failed to generate chart");
      toast({
        title: "Chart generation failed",
        description: error.message || "An error occurred while generating the chart",
        variant: "destructive",
      });
    },
  });

  const generateChart = async (prompt: string, chartType: string) => {
    setError(null);
    await generateChartMutation.mutateAsync({ prompt, chartType });
  };

  // Generate code whenever chart data changes (only for Gantt charts)
  useEffect(() => {
    if (chartData && chartType === 'gantt') {
      const code = generateChartCode(chartData as GanttChartData);
      setChartCode(code);
    } else {
      setChartCode(null);
    }
  }, [chartData, chartType]);

  return {
    generateChart,
    chartData,
    chartType,
    chartCode,
    isLoading: generateChartMutation.isPending,
    error,
  };
}
