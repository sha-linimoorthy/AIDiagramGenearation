import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { type BarChartData } from '@shared/schema';

interface LineChartProps {
  data: BarChartData;
}

const LineChart = ({ data }: LineChartProps) => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chartRef.current) {
      // Clear any existing chart
      d3.select(chartRef.current).selectAll("*").remove();
      
      renderLineChart(data, chartRef.current);
    }
  }, [data]);

  return <div ref={chartRef} className="w-full h-full"></div>;
};

function renderLineChart(data: BarChartData, container: HTMLElement) {
  const margin = { top: 50, right: 30, bottom: 60, left: 60 };
  const width = Math.max(container.clientWidth, 500) - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;
  
  // Ensure all data points have a category, use "Default" if not provided
  const dataWithCategories = data.data.map(d => ({
    ...d,
    category: d.category || "Default"
  }));
  
  // Group data by category for multiple lines
  const groupedData = d3.group(dataWithCategories, d => d.category);
  
  // Get all unique x-axis labels
  const labels = Array.from(new Set(dataWithCategories.map(d => d.label)));
  
  // Create SVG element
  const svg = d3.select(container)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);
  
  // Add title
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", -margin.top / 2)
    .attr("text-anchor", "middle")
    .attr("font-size", "1.2em")
    .attr("font-weight", "bold")
    .text(data.title);
  
  // X scale
  const x = d3.scaleBand()
    .domain(labels)
    .range([0, width])
    .padding(0.1);
  
  // Y scale
  const y = d3.scaleLinear()
    .domain([0, d3.max(dataWithCategories, d => d.value) as number * 1.1])
    .nice()
    .range([height, 0]);
  
  // X axis
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "translate(-10,0)rotate(-45)")
    .style("text-anchor", "end");
    
  // X axis label
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height + margin.bottom - 10)
    .attr("text-anchor", "middle")
    .text(data.xAxisLabel || "");
  
  // Y axis
  svg.append("g")
    .call(d3.axisLeft(y));
    
  // Y axis label
  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -margin.left + 15)
    .attr("x", -(height / 2))
    .attr("text-anchor", "middle")
    .text(data.yAxisLabel || "");
  
  // Color scale for categories
  const colorScale = d3.scaleOrdinal(d3.schemeCategory10);
  
  // Generate line for each category
  groupedData.forEach((values, category) => {
    // Create line generator
    const line = d3.line<any>()
      .x(d => x(d.label as string) as number + x.bandwidth() / 2)
      .y(d => y(d.value));
    
    // Add line
    svg.append("path")
      .datum(values)
      .attr("fill", "none")
      .attr("stroke", colorScale(category))
      .attr("stroke-width", 2)
      .attr("d", line);
    
    // Add dots for each data point
    svg.selectAll(`.dot-${category.replace(/\s+/g, "-")}`)
      .data(values)
      .enter()
      .append("circle")
      .attr("class", `dot-${category.replace(/\s+/g, "-")}`)
      .attr("cx", d => x(d.label as string) as number + x.bandwidth() / 2)
      .attr("cy", d => y(d.value))
      .attr("r", 4)
      .attr("fill", colorScale(category))
      .on("mouseover", function(event, d) {
        d3.select(this).attr("r", 7);
        
        // Show tooltip
        tooltip
          .style("opacity", 1)
          .html(`${d.label}: ${d.value}`)
          .style("left", `${event.pageX + 15}px`)
          .style("top", `${event.pageY - 30}px`);
      })
      .on("mouseout", function() {
        d3.select(this).attr("r", 4);
        tooltip.style("opacity", 0);
      });
  });
  
  // Add legend
  const legend = svg.append("g")
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .attr("text-anchor", "end")
    .selectAll("g")
    .data(Array.from(groupedData.keys()))
    .enter().append("g")
    .attr("transform", (d, i) => `translate(0,${i * 20})`);

  legend.append("rect")
    .attr("x", width - 19)
    .attr("width", 19)
    .attr("height", 19)
    .attr("fill", d => colorScale(d as string));

  legend.append("text")
    .attr("x", width - 24)
    .attr("y", 9.5)
    .attr("dy", "0.32em")
    .text(d => d as string);
  
  // Add tooltip
  const tooltip = d3.select(container)
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "1px")
    .style("border-radius", "5px")
    .style("padding", "5px");
}

export default LineChart;