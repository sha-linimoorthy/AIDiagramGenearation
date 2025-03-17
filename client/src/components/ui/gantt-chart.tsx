import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { type GanttChartData, type Task } from '@shared/schema';

interface GanttChartProps {
  data: GanttChartData;
}

const GanttChart = ({ data }: GanttChartProps) => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current || !data || !data.tasks || data.tasks.length === 0) {
      console.log("Unable to render chart:", { 
        chartRef: !!chartRef.current, 
        data: !!data, 
        tasks: data?.tasks?.length 
      });
      return;
    }

    console.log("Rendering gantt chart with data:", data);

    // Clear previous chart
    d3.select(chartRef.current).selectAll('*').remove();

    renderGanttChart(data, chartRef.current);
  }, [data]);

  return <div ref={chartRef} className="w-full h-full min-h-[400px]" />;
};

function renderGanttChart(data: GanttChartData, container: HTMLElement) {
  // Parse dates
  const tasks = data.tasks.map(task => ({
    ...task,
    startDate: new Date(task.start),
    endDate: new Date(task.end)
  }));

  // Set up dimensions
  const margin = { top: 40, right: 120, bottom: 40, left: 160 };
  const width = Math.min(960, container.clientWidth) - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  // Create SVG
  const svg = d3.select(container)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Set up scales
  const xScale = d3.scaleTime()
    .domain([
      d3.min(tasks, d => d.startDate) || new Date(),
      d3.max(tasks, d => d.endDate) || new Date()
    ])
    .range([0, width]);

  const yScale = d3.scaleBand()
    .domain(tasks.map(d => d.name))
    .range([0, height])
    .padding(0.2);

  // Create axes
  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3.axisLeft(yScale);

  svg.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(xAxis);

  svg.append('g')
    .call(yAxis);

  // Add title
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', -20)
    .attr('text-anchor', 'middle')
    .style('font-size', '16px')
    .style('font-weight', 'bold')
    .text(data.title);

  // Create category color scale
  const categories = Array.from(new Set(tasks.map(d => d.category || 'Default')));
  const colorScale = d3.scaleOrdinal()
    .domain(categories)
    .range(['#4338CA', '#3B82F6', '#10B981', '#F59E0B', '#EC4899']);

  // Create bars
  svg.selectAll('.task')
    .data(tasks)
    .join('rect')
    .attr('class', 'task')
    .attr('x', d => xScale(d.startDate))
    .attr('y', d => yScale(d.name) || 0)
    .attr('width', d => xScale(d.endDate) - xScale(d.startDate))
    .attr('height', yScale.bandwidth())
    .attr('rx', 3)
    .attr('ry', 3)
    .style('fill', d => String(colorScale(d.category || 'Default')))
    .style('stroke', '#fff')
    .style('stroke-width', 1)
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

      tooltip.html(`
        <strong>${d.name}</strong><br/>
        Start: ${d.startDate.toLocaleDateString()}<br/>
        End: ${d.endDate.toLocaleDateString()}<br/>
        ${d.category ? `Category: ${d.category}` : ''}
      `)
        .style('left', `${event.pageX + 10}px`)
        .style('top', `${event.pageY - 28}px`);
    })
    .on('mouseout', function() {
      // Remove tooltip
      d3.selectAll('.tooltip').remove();
    });

  // Add legend
  const legend = svg.append('g')
    .attr('transform', `translate(${width - 100}, 0)`);

  categories.forEach((category, i) => {
    const legendRow = legend.append('g')
      .attr('transform', `translate(0, ${i * 20})`);

    legendRow.append('rect')
      .attr('width', 10)
      .attr('height', 10)
      .attr('fill', String(colorScale(category)));

    legendRow.append('text')
      .attr('x', 20)
      .attr('y', 10)
      .attr('text-anchor', 'start')
      .style('font-size', '12px')
      .text(category);
  });
}

export default GanttChart;
