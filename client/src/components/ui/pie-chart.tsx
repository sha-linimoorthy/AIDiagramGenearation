import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { type PieChartData, type PieChartDataPoint } from '@shared/schema';

interface PieChartProps {
  data: PieChartData;
}

const PieChart = ({ data }: PieChartProps) => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current || !data || !data.data || data.data.length === 0) {
      console.log("Unable to render pie chart:", { 
        chartRef: !!chartRef.current, 
        data: !!data, 
        dataPoints: data?.data?.length 
      });
      return;
    }

    console.log("Rendering pie chart with data:", data);

    // Clear previous chart
    d3.select(chartRef.current).selectAll('*').remove();

    renderPieChart(data, chartRef.current);
  }, [data]);

  return <div ref={chartRef} className="w-full h-full min-h-[400px]" />;
};

function renderPieChart(data: PieChartData, container: HTMLElement) {
  // Set up dimensions
  const margin = { top: 50, right: 20, bottom: 20, left: 20 };
  const width = Math.min(960, container.clientWidth) - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;
  const radius = Math.min(width, height) / 2;

  // Create SVG
  const svg = d3.select(container)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${width / 2 + margin.left}, ${height / 2 + margin.top})`);

  // Create color scale
  const colorScale = d3.scaleOrdinal()
    .domain(data.data.map(d => d.label))
    .range(['#4338CA', '#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#F472B6', '#34D399']);

  // Update the color for data points that have a specified color
  const colorAccessor = (d: d3.PieArcDatum<PieChartDataPoint>): string => {
    const datum = d.data;
    return datum.color || colorScale(datum.label) as string;
  };

  // Create pie layout
  const pie = d3.pie<PieChartDataPoint>()
    .value(d => d.value)
    .sort(null);

  // Create arc generator
  const arc = d3.arc<d3.PieArcDatum<PieChartDataPoint>>()
    .innerRadius(0)
    .outerRadius(radius);

  // Generate the pie chart segments
  const arcs = svg.selectAll('.arc')
    .data(pie(data.data))
    .enter()
    .append('g')
    .attr('class', 'arc');

  // Add slices
  arcs.append('path')
    .attr('d', arc)
    .attr('fill', colorAccessor)
    .attr('stroke', 'white')
    .style('stroke-width', '2px')
    .on('mouseover', function(event, d) {
      // Create tooltip
      const tooltip = d3.select('body')
        .append('div')
        .attr('class', 'tooltip')
        .style('position', 'absolute')
        .style('background', 'white')
        .style('border', '1px solid #ddd')
        .style('padding', '10px')
        .style('border-radius', '5px')
        .style('box-shadow', '0 2px 5px rgba(0,0,0,0.1)')
        .style('pointer-events', 'none')
        .style('opacity', 0)
        .style('z-index', 1000);

      tooltip.transition()
        .duration(200)
        .style('opacity', 0.9);

      const percent = ((d.data.value / d3.sum(data.data, d => d.value)) * 100).toFixed(1);
      
      tooltip.html(`
        <strong>${d.data.label}</strong><br/>
        Value: ${d.data.value}<br/>
        Percentage: ${percent}%
      `)
        .style('left', `${event.pageX + 10}px`)
        .style('top', `${event.pageY - 28}px`);
    })
    .on('mouseout', function() {
      // Remove tooltip
      d3.selectAll('.tooltip').remove();
    });

  // Add title
  svg.append('text')
    .attr('x', 0)
    .attr('y', -radius - 20)
    .attr('text-anchor', 'middle')
    .style('font-size', '16px')
    .style('font-weight', 'bold')
    .text(data.title);

  // Add legend
  const legendRectSize = 15;
  const legendSpacing = 4;
  const legendHeight = legendRectSize + legendSpacing;

  const legend = svg.selectAll('.legend')
    .data(data.data)
    .enter()
    .append('g')
    .attr('class', 'legend')
    .attr('transform', (d, i) => {
      const height = legendHeight;
      const offset = height * data.data.length / 2;
      const x = radius + 30;
      const y = i * height - offset;
      return `translate(${x}, ${y})`;
    });

  legend.append('rect')
    .attr('width', legendRectSize)
    .attr('height', legendRectSize)
    .style('fill', (d) => d.color || colorScale(d.label) as string)
    .style('stroke', 'white');

  legend.append('text')
    .attr('x', legendRectSize + 5)
    .attr('y', legendRectSize - 2)
    .text((d) => `${d.label}: ${d.value}`);
}

export default PieChart;