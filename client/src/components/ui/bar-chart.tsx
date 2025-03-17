import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { type BarChartData, type BarChartDataPoint } from '@shared/schema';

interface BarChartProps {
  data: BarChartData;
}

const BarChart = ({ data }: BarChartProps) => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current || !data || !data.data || data.data.length === 0) {
      console.log("Unable to render bar chart:", { 
        chartRef: !!chartRef.current, 
        data: !!data, 
        dataPoints: data?.data?.length 
      });
      return;
    }

    console.log("Rendering bar chart with data:", data);

    // Clear previous chart
    d3.select(chartRef.current).selectAll('*').remove();

    renderBarChart(data, chartRef.current);
  }, [data]);

  return <div ref={chartRef} className="w-full h-full min-h-[400px]" />;
};

function renderBarChart(data: BarChartData, container: HTMLElement) {
  // Set up dimensions
  const margin = { top: 40, right: 120, bottom: 60, left: 60 };
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
  const x = d3.scaleBand()
    .domain(data.data.map(d => d.label))
    .range([0, width])
    .padding(0.2);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data.data, d => d.value) || 0])
    .nice()
    .range([height, 0]);

  // Create x axis
  svg.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll('text')
    .attr('transform', 'translate(-10,0)rotate(-45)')
    .style('text-anchor', 'end');

  // Create y axis
  svg.append('g')
    .call(d3.axisLeft(y));

  // Create category color scale
  const categories = Array.from(new Set(data.data.map(d => d.category || 'Default')));
  const colorScale = d3.scaleOrdinal()
    .domain(categories)
    .range(['#4338CA', '#3B82F6', '#10B981', '#F59E0B', '#EC4899']);

  // Add bars
  svg.selectAll('.bar')
    .data(data.data)
    .join('rect')
    .attr('class', 'bar')
    .attr('x', d => x(d.label) || 0)
    .attr('y', d => y(d.value))
    .attr('width', x.bandwidth())
    .attr('height', d => height - y(d.value))
    .attr('fill', d => String(colorScale(d.category || 'Default')))
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
        <strong>${d.label}</strong><br/>
        Value: ${d.value}<br/>
        ${d.category ? `Category: ${d.category}` : ''}
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
    .attr('x', width / 2)
    .attr('y', -15)
    .attr('text-anchor', 'middle')
    .style('font-size', '16px')
    .style('font-weight', 'bold')
    .text(data.title);

  // Add X axis label
  if (data.xAxisLabel) {
    svg.append('text')
      .attr('transform', `translate(${width / 2}, ${height + margin.bottom - 10})`)
      .style('text-anchor', 'middle')
      .text(data.xAxisLabel);
  }

  // Add Y axis label
  if (data.yAxisLabel) {
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -margin.left + 15)
      .attr('x', -height / 2)
      .attr('text-anchor', 'middle')
      .text(data.yAxisLabel);
  }

  // Add legend
  const legend = svg.append('g')
    .attr('transform', `translate(${width + 10}, 0)`);

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

export default BarChart;