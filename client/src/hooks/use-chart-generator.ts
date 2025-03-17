import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { type GanttChartData } from '@shared/schema';
import { generateChartCode } from '@/lib/chart-utils';

interface ChartGeneratorResult {
  generateChart: (prompt: string, chartType: string) => Promise<void>;
  chartData: GanttChartData | null;
  chartCode: string | null;
  isLoading: boolean;
  error: string | null;
}

export function useChartGenerator(): ChartGeneratorResult {
  const [chartData, setChartData] = useState<GanttChartData | null>(null);
  const [chartCode, setChartCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const generateChartMutation = useMutation({
    mutationFn: async ({ prompt, chartType }: { prompt: string, chartType: string }) => {
      const response = await apiRequest('POST', '/api/generate-chart', { prompt, chartType });
      return await response.json();
    },
    onSuccess: (data: GanttChartData) => {
      setChartData(data);
      setError(null);
      toast({
        title: "Chart generated successfully",
        description: `Generated "${data.title}" with ${data.tasks.length} tasks`,
      });
    },
    onError: (error: Error) => {
      setChartData(null);
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

  // Generate code whenever chart data changes
  useEffect(() => {
    if (chartData) {
      const code = generateChartCode(chartData);
      setChartCode(code);
    } else {
      setChartCode(null);
    }
  }, [chartData]);

  return {
    generateChart,
    chartData,
    chartCode,
    isLoading: generateChartMutation.isPending,
    error,
  };
}
