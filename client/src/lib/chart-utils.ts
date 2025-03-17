import { type GanttChartData, type Task } from '@shared/schema';

/**
 * Generates D3.js code for a Gantt chart based on the provided data
 * @param data The Gantt chart data
 * @returns A string containing the D3.js code
 */
export function generateChartCode(data: GanttChartData): string {
  return `// D3.js Gantt Chart for "${data.title}"
import * as d3 from 'd3';

// Chart data
const chartData = ${JSON.stringify(data, null, 2)};

function renderGanttChart(data, containerId) {
  // Clear previous chart
  d3.select(containerId).html("");
  
  // Parse dates
  const tasks = data.tasks.map(task => ({
    ...task,
    startDate: new Date(task.start),
    endDate: new Date(task.end)
  }));

  const margin = {top: 40, right: 120, bottom: 40, left: 160};
  const width = 960 - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;
  
  // Create SVG
  const svg = d3.select(containerId)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", \`translate(\${margin.left},\${margin.top})\`);
    
  // Set up scales
  const xScale = d3.scaleTime()
    .domain([
      d3.min(tasks, d => d.startDate),
      d3.max(tasks, d => d.endDate)
    ])
    .range([0, width]);
    
  const yScale = d3.scaleBand()
    .domain(tasks.map(d => d.name))
    .range([0, height])
    .padding(0.2);
    
  // Create axes
  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3.axisLeft(yScale);
  
  svg.append("g")
    .attr("transform", \`translate(0,\${height})\`)
    .call(xAxis);
    
  svg.append("g")
    .call(yAxis);
    
  // Add title
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", -20)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text(data.title);
    
  // Create category color scale
  const categories = Array.from(new Set(tasks.map(d => d.category || 'Default')));
  const colorScale = d3.scaleOrdinal()
    .domain(categories)
    .range(['#4338CA', '#3B82F6', '#10B981', '#F59E0B', '#EC4899']);
    
  // Create bars
  svg.selectAll(".task")
    .data(tasks)
    .join("rect")
    .attr("class", "task")
    .attr("x", d => xScale(d.startDate))
    .attr("y", d => yScale(d.name))
    .attr("width", d => xScale(d.endDate) - xScale(d.startDate))
    .attr("height", yScale.bandwidth())
    .attr("rx", 3)
    .attr("ry", 3)
    .style("fill", d => colorScale(d.category || 'Default'))
    .style("stroke", "#fff")
    .style("stroke-width", 1)
    .on("mouseover", function(event, d) {
      tooltip.transition()
        .duration(200)
        .style("opacity", .9);
      tooltip.html(\`
        <strong>\${d.name}</strong><br/>
        Start: \${d.startDate.toLocaleDateString()}<br/>
        End: \${d.endDate.toLocaleDateString()}<br/>
        \${d.category ? \`Category: \${d.category}\` : ''}
      \`)
        .style("left", (event.pageX) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function() {
      tooltip.transition()
        .duration(500)
        .style("opacity", 0);
    });
    
  // Add tooltip
  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("background", "white")
    .style("border", "1px solid #ddd")
    .style("border-radius", "4px")
    .style("padding", "8px")
    .style("pointer-events", "none");
    
  // Add legend
  const legend = svg.append("g")
    .attr("transform", \`translate(\${width - 120}, 0)\`);
    
  categories.forEach((category, i) => {
    const legendRow = legend.append("g")
      .attr("transform", \`translate(0, \${i * 20})\`);
      
    legendRow.append("rect")
      .attr("width", 10)
      .attr("height", 10)
      .attr("fill", colorScale(category));
      
    legendRow.append("text")
      .attr("x", 20)
      .attr("y", 10)
      .attr("text-anchor", "start")
      .style("font-size", "12px")
      .text(category);
  });
}

// Render the chart
renderGanttChart(chartData, '#gantt-chart');
`;
}

/**
 * Converts a Gantt chart data object to a D3.js chart
 * @param data The Gantt chart data
 * @param container The container element to render the chart in
 */
export function renderGanttChart(data: GanttChartData, container: HTMLElement): void {
  // Implementation delegated to the GanttChart component
}
