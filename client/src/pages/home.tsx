import { useState } from 'react';
import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import GanttChart from '@/components/ui/gantt-chart';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useChartGenerator } from '@/hooks/use-chart-generator';
import { 
  ClipboardIcon, 
  DownloadIcon, 
  Share2Icon, 
  MaximizeIcon,
  RefreshCw
} from 'lucide-react';
import { type GanttChartData } from '@shared/schema';

const Home = () => {
  const [prompt, setPrompt] = useState<string>('Generate a detailed Gantt chart for Agile sprints. Include tasks for backlog grooming, development, testing, and review.');
  const [codeVisible, setCodeVisible] = useState<boolean>(true);
  const { toast } = useToast();
  const { generateChart, chartData, isLoading, chartCode, error } = useChartGenerator();

  const handleGenerateChart = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Input required",
        description: "Please enter a description for the chart you want to generate.",
        variant: "destructive",
      });
      return;
    }

    await generateChart(prompt, 'gantt');
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
    const svgElement = document.querySelector('#gantt-chart svg');
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

    // Create a link and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = `${chartData?.title || 'gantt-chart'}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-neutral-light text-neutral-dark">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        <Header title="Gantt Chart Generator" />
        
        <div className="p-6">
          {/* Input Section */}
          <Card className="mb-6">
            <CardContent className="p-0">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-medium">Describe the chart you want to create</h2>
                <p className="text-sm text-gray-500">Be specific about tasks, timelines, and dependencies</p>
              </div>
              <div className="p-4">
                <Textarea 
                  id="chart-prompt" 
                  rows={3} 
                  className="w-full resize-none"
                  placeholder="e.g., Generate a detailed Gantt chart for Agile sprints. Include tasks for backlog grooming, development, testing, and review."
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
                  <h2 className="font-medium">Gantt Chart Visualization</h2>
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
                <div id="gantt-chart" className="min-h-[400px] w-full">
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
                    <GanttChart data={chartData} />
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
