import { useState } from 'react';
import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import ChartRenderer from '@/components/ui/chart-renderer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useChartGenerator } from '@/hooks/use-chart-generator';
import { 
  ClipboardIcon, 
  DownloadIcon, 
  Share2Icon, 
  MaximizeIcon,
  RefreshCw,
  BarChartIcon,
  PieChartIcon,
  GanttChartSquareIcon
} from 'lucide-react';
import { type ChartData } from '@shared/schema';

const Home = () => {
  const [prompt, setPrompt] = useState<string>('Generate a detailed Gantt chart for Agile sprints. Include tasks for backlog grooming, development, testing, and review.');
  const [selectedChartType, setSelectedChartType] = useState<string>('gantt');
  const [codeVisible, setCodeVisible] = useState<boolean>(true);
  const { toast } = useToast();
  const { generateChart, chartData, chartType, isLoading, chartCode, error } = useChartGenerator();

  // Chart type options with icons
  const chartTypes = [
    { id: 'gantt', name: 'Gantt Chart', icon: <GanttChartSquareIcon className="h-4 w-4 mr-2" /> },
    { id: 'bar', name: 'Bar Chart', icon: <BarChartIcon className="h-4 w-4 mr-2" /> },
    { id: 'pie', name: 'Pie Chart', icon: <PieChartIcon className="h-4 w-4 mr-2" /> },
  ];

  // Get chart type prompt suggestions
  const getPlaceholderPrompt = (type: string) => {
    switch (type) {
      case 'gantt':
        return 'Generate a detailed Gantt chart for Agile sprints. Include tasks for backlog grooming, development, testing, and review.';
      case 'bar':
        return 'Create a bar chart showing sales data for the last 6 months across different product categories.';
      case 'pie':
        return 'Generate a pie chart showing market share distribution among top 5 companies in the tech industry.';
      default:
        return '';
    }
  };

  // Handle chart type change
  const handleChartTypeChange = (value: string) => {
    setSelectedChartType(value);
    setPrompt(getPlaceholderPrompt(value));
  };

  const handleGenerateChart = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Input required",
        description: "Please enter a description for the chart you want to generate.",
        variant: "destructive",
      });
      return;
    }

    await generateChart(prompt, selectedChartType);
  };

  const handleClearPrompt = () => {
    setPrompt('');
  };

  const handleCopyCode = () => {
    if (chartCode) {
      navigator.clipboard.writeText(chartCode);
      toast({
        title: "Code copied",
        description: "Chart code has been copied to your clipboard.",
      });
    }
  };

  const handleDownloadChart = () => {
    // Get the SVG element
    const svgElement = document.querySelector('#chart-container svg');
    if (!svgElement) {
      toast({
        title: "No chart to download",
        description: "Please generate a chart first.",
        variant: "destructive",
      });
      return;
    }

    // Create a blob from the SVG element
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    // Create appropriate file name based on chart type
    let fileName = chartData?.title || 'chart';
    if (chartType) {
      fileName = `${fileName}-${chartType}`;
    }

    // Create a link and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-neutral-light text-neutral-dark">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        <Header title="AI Chart Generator" />
        
        <div className="p-6">
          {/* Input Section */}
          <Card className="mb-6">
            <CardContent className="p-0">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-medium">Describe the chart you want to create</h2>
                <p className="text-sm text-gray-500">Select a chart type and be specific about your data needs</p>
              </div>
              <div className="p-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Chart Type</label>
                  <Select value={selectedChartType} onValueChange={handleChartTypeChange}>
                    <SelectTrigger className="w-full md:w-64">
                      <SelectValue placeholder="Select a chart type" />
                    </SelectTrigger>
                    <SelectContent>
                      {chartTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          <div className="flex items-center">
                            {type.icon}
                            {type.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Textarea 
                  id="chart-prompt" 
                  rows={3} 
                  className="w-full resize-none"
                  placeholder={`e.g., ${getPlaceholderPrompt(selectedChartType)}`}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
                
                <div className="flex justify-end mt-3 gap-2">
                  <Button variant="outline" onClick={handleClearPrompt}>
                    Clear
                  </Button>
                  <Button 
                    onClick={handleGenerateChart}
                    disabled={isLoading}
                    className="bg-primary text-white"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>Generate Chart</>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Visualization Section */}
          <Card className="mb-6">
            <CardContent className="p-0">
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <div>
                  <h2 className="font-medium">{chartType ? `${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart Visualization` : 'Chart Visualization'}</h2>
                  <p className="text-sm text-gray-500">{chartData?.title || 'No chart generated yet'}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={handleDownloadChart} disabled={!chartData}>
                    <DownloadIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" disabled={!chartData}>
                    <MaximizeIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" disabled={!chartData}>
                    <Share2Icon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Visualization area */}
              <div className="p-4 overflow-x-auto">
                <div id="chart-container" className="min-h-[400px] w-full">
                  {error && (
                    <div className="flex items-center justify-center min-h-[400px] text-red-500">
                      <p>Error: {error}</p>
                    </div>
                  )}
                  {!chartData && !isLoading && !error && (
                    <div className="flex items-center justify-center min-h-[400px] text-gray-400">
                      <p>Enter a prompt and click Generate Chart to create a visualization</p>
                    </div>
                  )}
                  {isLoading && (
                    <div className="flex items-center justify-center min-h-[400px]">
                      <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  )}
                  {chartData && !isLoading && (
                    <ChartRenderer data={chartData} chartType={chartType} />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Code Section */}
          {codeVisible && (
            <Card>
              <CardContent className="p-0">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                  <div>
                    <h2 className="font-medium">Generated Code</h2>
                    <p className="text-sm text-gray-500">D3.js implementation</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={handleCopyCode} disabled={!chartCode}>
                    <ClipboardIcon className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="p-4 overflow-x-auto">
                  <pre className="bg-gray-800 text-gray-200 p-4 rounded-md text-sm font-mono overflow-x-auto">
                    <code>{chartCode || '// Chart code will appear here after generation'}</code>
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Home;
