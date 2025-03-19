import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface MindMapNode {
  id: string;
  name: string;
  children?: MindMapNode[];
}

interface MindMapChartProps {
  data: {
    title: string;
    root: MindMapNode;
  };
}

const MindMapChart = ({ data }: MindMapChartProps) => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current || !data) return;
    
    d3.select(chartRef.current).selectAll('*').remove();
    
    const width = 960;
    const height = 600;
    
    const svg = d3.select(chartRef.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);
    
    const tree = d3.tree<MindMapNode>()
      .size([2 * Math.PI, Math.min(width, height) / 3])
      .separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth);
    
    const root = d3.hierarchy(data.root);
    const links = tree(root).links();
    const nodes = root.descendants();
    
    const linkGenerator = d3.linkRadial<any, any>()
      .angle(d => d.x!)  
      .radius(d => d.y!);
    
    // Add links
    svg.selectAll('path')
      .data(links)
      .join('path')
      .attr('fill', 'none')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.4)
      .attr('stroke-width', 1.5)
      .attr('d', linkGenerator);
    
    // Add nodes
    const node = svg.selectAll('g')
      .data(nodes)
      .join('g')
      .attr('transform', d => `translate(${radialPoint(d.x!, d.y!)})`);
    
    node.append('circle')
      .attr('fill', d => d.children ? '#555' : '#999')
      .attr('r', 4);
    
    node.append('text')
      .attr('dy', '0.31em')
      .attr('x', d => {
        // Use nullish coalescing operator to handle undefined case
        const xVal = d.x ?? 0;
        return (xVal < Math.PI === !d.children ? 6 : -6);
      })
      .attr('text-anchor', d => {
        const xVal = d.x ?? 0;
        return (xVal < Math.PI === !d.children ? 'start' : 'end');
      })
      .attr('transform', d => {
        const xVal = d.x ?? 0;
        return (xVal >= Math.PI ? 'rotate(180)' : null);
      })
      .text(d => d.data.name)
      .clone(true).lower()
      .attr('stroke', 'white')
      .attr('stroke-width', 3);
    
    // Add title
    svg.append('text')
      .attr('x', 0)
      .attr('y', -height/2 + 20)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .text(data.title);
  }, [data]);
  
  const radialPoint = (x: number, y: number): [number, number] => {
    return [(y = +y) * Math.cos(x -= Math.PI / 2), y * Math.sin(x)];
  };
  
  return <div ref={chartRef} className="w-full h-full min-h-[600px]" />;
};

export default MindMapChart;