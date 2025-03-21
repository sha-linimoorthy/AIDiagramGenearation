import { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import ChartRenderer from '@/components/ui/chart-renderer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
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
  GanttChartSquareIcon,
  LineChartIcon,
  NetworkIcon
} from 'lucide-react';
import { type ChartData } from '@shared/schema';

// Get chart type prompt suggestions
const getPlaceholderPrompt = (type: string): string => {
  switch (type) {
    case 'gantt':
      return 'Generate a detailed Gantt chart for Agile sprints. Include tasks for backlog grooming 2025 March 2 to 2025 March 4, development 2025 March 5 to 2025 March 17, testing 2025 March 10 to 2025 March 20, and review 2025 March 21 to 2025 March 24.';
    case 'bar':
      return 'Create a bar chart displaying the top 5 countries by GDP. Use the following data: USA - $25 trillion, China - $18 trillion, Japan - $4.2 trillion, Germany - $4.0 trillion, UK - $3.3 trillion. Label the axes appropriately and give the chart a title: Top 5 Countries by GDP (USD)';
    case 'pie':
      return 'Generate a pie chart to visualize Bug Status Distribution. The chart should represent the percentage of bugs based on their current status: Open, In Progress, Fixed, and Closed. Use the following data: Open: 30, In Progress: 25, Fixed: 20, Closed: 25';
    case 'line':
      return 'Create a line chart showing temperature trends over the past 12 months.';
    case 'flow':
      return 'Generate a flow chart to visualize the software development process.';
    default:
      return 'Describe the chart you want to create...';
  }
};

const Home = () => {
  // Initialize state variables
  const [prompt, setPrompt] = useState<string>(getPlaceholderPrompt('gantt'));
  const [selectedChartType, setSelectedChartType] = useState<string>('gantt');
  const [codeVisible, setCodeVisible] = useState<boolean>(true);
  const { toast } = useToast();
  const { generateChart, chartData, chartType, isLoading, chartCode, error } = useChartGenerator();
  
  // Get chart type from URL query params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlChartType = urlParams.get('type');
    const validChartTypes = ['gantt', 'bar', 'pie', 'line', 'flow'];
    if (urlChartType && validChartTypes.includes(urlChartType)) {
      setSelectedChartType(urlChartType);
      setPrompt(getPlaceholderPrompt(urlChartType));
    }
  }, []);

  // Chart type options with icons
  const chartTypes = [
    { id: 'gantt', name: 'Gantt Chart', icon: <GanttChartSquareIcon className="h-4 w-4 mr-2" /> },
    { id: 'bar', name: 'Bar Chart', icon: <BarChartIcon className="h-4 w-4 mr-2" /> },
    { id: 'pie', name: 'Pie Chart', icon: <PieChartIcon className="h-4 w-4 mr-2" /> },
    /* { id: 'line', name: 'Line Chart', icon: <LineChartIcon className="h-4 w-4 mr-2" /> },
    { id: 'flow', name: 'Flow Chart', icon: <NetworkIcon className="h-4 w-4 mr-2" /> },*/
  ];

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
  
  // Handle fullscreen view of the chart
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  
  const handleFullscreen = () => {
    if (!chartData) {
      toast({
        title: "No chart to display",
        description: "Please generate a chart first.",
        variant: "destructive",
      });
      return;
    }
    
    setIsFullscreen(!isFullscreen);
  };
  
  const handleShare = () => {
    if (!chartData) {
      toast({
        title: "No chart to share",
        description: "Please generate a chart first.",
        variant: "destructive",
      });
      return;
    }
    
    // Create a share link with the current chart type and data
    const url = new URL(window.location.href);
    url.searchParams.set('type', selectedChartType);
    
    // Copy to clipboard
    navigator.clipboard.writeText(url.toString());
    toast({
      title: "Link copied to clipboard",
      description: "Share this link to show the chart type. Note that chart data will need to be regenerated.",
    });
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-neutral-light text-neutral-dark">
      <Sidebar activeChartType={selectedChartType} />
      
      <main className="flex-1 overflow-auto">
        <Header title="Intelliassist Chart Generator" />
        
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
                  <Button variant="ghost" size="icon" onClick={handleFullscreen} disabled={!chartData}>
                    <MaximizeIcon className="h-4 w-4" />
                  </Button>
                  {/*<Button variant="ghost" size="icon" onClick={handleShare} disabled={!chartData}>
                    <Share2Icon className="h-4 w-4" />
                  </Button>*/}
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
          {/*{codeVisible && chartCode && (
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
                    <code>{chartCode}</code>
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}*/}
        </div>
      </main>
      
      {/* Fullscreen Dialog */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {chartType ? `${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart` : 'Chart'} - {chartData?.title}
            </DialogTitle>
            <DialogDescription>
              Full screen visualization
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto p-4">
            <div className="h-full w-full">
              {chartData && chartType && (
                <ChartRenderer data={chartData} chartType={chartType} />
              )}
            </div>
          </div>
          
          <div className="flex justify-between items-center pt-4 border-t">
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={handleDownloadChart}>
                <DownloadIcon className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleShare}>
                <Share2Icon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Home;
