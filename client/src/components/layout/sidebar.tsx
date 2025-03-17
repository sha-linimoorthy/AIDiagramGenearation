import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { type Chart } from '@shared/schema';
import { 
  BarChartHorizontal, 
  PieChart, 
  BarChart, 
  LineChart, 
  Network, 
  Settings, 
  CircleUser, 
  GanttChartSquare 
} from 'lucide-react';

export type ChartType = {
  id: string;
  name: string;
  icon: React.ReactNode;
  path: string;
};

export const chartTypes: ChartType[] = [
  { id: 'gantt', name: 'Gantt Chart', icon: <GanttChartSquare className="h-4 w-4" />, path: '/?type=gantt' },
  { id: 'bar', name: 'Bar Chart', icon: <BarChart className="h-4 w-4" />, path: '/?type=bar' },
  { id: 'pie', name: 'Pie Chart', icon: <PieChart className="h-4 w-4" />, path: '/?type=pie' },
  { id: 'line', name: 'Line Chart', icon: <LineChart className="h-4 w-4" />, path: '/?type=line' },
  { id: 'flow', name: 'Flow Chart', icon: <Network className="h-4 w-4" />, path: '/?type=flow' }
];

interface SidebarProps {
  activeChartType?: string;
}

const Sidebar = ({ activeChartType = 'gantt' }: SidebarProps) => {
  const [location] = useLocation();
  
  // Fetch recent charts
  const { data: recentCharts } = useQuery<Chart[]>({
    queryKey: ['/api/charts'],
  });

  return (
    <aside className="w-full md:w-64 bg-white border-r border-gray-200 md:h-screen">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <CircleUser className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-xl font-semibold">ChartifyAI</h1>
        </div>
        <p className="text-sm text-gray-500 mt-1">AI-powered diagram generator</p>
      </div>
      
      <nav className="p-4">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Chart Types</h2>
        <ul className="space-y-1">
          {chartTypes.map((type) => (
            <li key={type.name}>
              <Link 
                href={type.path}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100",
                  type.id === activeChartType
                    ? "bg-primary/10 text-primary" 
                    : "text-gray-700"
                )}
              >
                {type.icon}
                <span>{type.name}</span>
              </Link>
            </li>
          ))}
        </ul>
        
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 mt-6">Recent Charts</h2>
        <ul className="space-y-1">
          {recentCharts && recentCharts.length > 0 ? (
            recentCharts.map((chart) => (
              <li key={chart.id}>
                <Link 
                  href={`/charts/${chart.id}`}
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100"
                >
                  <BarChartHorizontal className="h-4 w-4" />
                  <span className="text-sm">{chart.title}</span>
                </Link>
              </li>
            ))
          ) : (
            <li className="px-3 py-2 text-sm text-gray-500">No recent charts</li>
          )}
        </ul>
      </nav>
      
      <div className="absolute bottom-0 left-0 w-full md:w-64 p-4 border-t border-gray-200 bg-white">
        <div className="flex items-center gap-2">
          <Avatar>
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">User</p>
            <p className="text-xs text-gray-500">user@example.com</p>
          </div>
          <button className="ml-auto text-gray-500 hover:text-gray-700">
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
