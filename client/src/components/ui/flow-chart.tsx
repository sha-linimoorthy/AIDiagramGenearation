import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

// Define interfaces for flow chart data
interface FlowNode {
  id: string;
  label: string;
  type: 'start' | 'process' | 'decision' | 'end';
}

interface FlowLink {
  source: string;
  target: string;
  label?: string;
}

interface FlowChartData {
  title: string;
  nodes: FlowNode[];
  links: FlowLink[];
}

interface FlowChartProps {
  data: FlowChartData;
}

const FlowChart = ({ data }: FlowChartProps) => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chartRef.current) {
      // Clear any existing chart
      d3.select(chartRef.current).selectAll("*").remove();
      
      renderFlowChart(data, chartRef.current);
    }
  }, [data]);

  return <div ref={chartRef} className="w-full h-full"></div>;
};

function renderFlowChart(data: FlowChartData, container: HTMLElement) {
  const margin = { top: 50, right: 30, bottom: 30, left: 30 };
  const width = Math.max(container.clientWidth, 500) - margin.left - margin.right;
  const height = 600 - margin.top - margin.bottom;
  
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
  
  // Create a force simulation
  const simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id((d: any) => d.id).distance(150))
    .force("charge", d3.forceManyBody().strength(-300))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collide", d3.forceCollide(60));
  
  // Process the nodes and links data
  const nodes = data.nodes.map(node => ({...node}));
  const links = data.links.map(link => ({...link}));
  
  // Node color based on type
  const nodeColors: Record<string, string> = {
    start: "#4CAF50",  // Green
    process: "#2196F3", // Blue
    decision: "#FFC107", // Yellow
    end: "#F44336"     // Red
  };
  
  // Node shape based on type
  const nodeShapes: Record<string, (selection: any) => void> = {
    start: (selection) => selection.append("circle").attr("r", 30),
    process: (selection) => selection.append("rect")
      .attr("width", 120).attr("height", 50)
      .attr("x", -60).attr("y", -25),
    decision: (selection) => selection.append("polygon")
      .attr("points", "0,-40 40,0 0,40 -40,0"),
    end: (selection) => selection.append("circle").attr("r", 30)
  };
  
  // Create links
  const link = svg.append("g")
    .selectAll("line")
    .data(links)
    .enter()
    .append("g");
  
  // Add the actual link line
  const linkLine = link.append("path")
    .attr("fill", "none")
    .attr("stroke", "#999")
    .attr("stroke-width", 2)
    .attr("marker-end", "url(#arrowhead)");
  
  // Add link labels
  const linkLabel = link.append("text")
    .attr("dy", -5)
    .attr("text-anchor", "middle")
    .attr("font-size", "12px")
    .text(d => d.label || "");
  
  // Create nodes
  const node = svg.append("g")
    .selectAll(".node")
    .data(nodes)
    .enter()
    .append("g")
    .attr("class", "node")
    .call(d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended));
  
  // Add shapes to nodes based on type
  node.each(function(d: any) {
    const shape = nodeShapes[d.type] || nodeShapes.process;
    shape(d3.select(this))
      .attr("fill", nodeColors[d.type] || "#2196F3")
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);
  });
  
  // Add labels to nodes
  node.append("text")
    .attr("text-anchor", "middle")
    .attr("dy", ".3em")
    .attr("fill", "#fff")
    .attr("font-size", "12px")
    .text(d => d.label);
  
  // Add arrow marker
  svg.append("defs").append("marker")
    .attr("id", "arrowhead")
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 25)
    .attr("refY", 0)
    .attr("markerWidth", 6)
    .attr("markerHeight", 6)
    .attr("orient", "auto")
    .append("path")
    .attr("d", "M0,-5L10,0L0,5")
    .attr("fill", "#999");
  
  // Set up simulation
  simulation
    .nodes(nodes as any)
    .on("tick", ticked);
  
  (simulation.force("link") as d3.ForceLink<any, any>)
    .links(links);
  
  // Tick function to update positions
  function ticked() {
    // Update link positions
    linkLine.attr("d", function(d: any) {
      const dx = d.target.x - d.source.x;
      const dy = d.target.y - d.source.y;
      const angle = Math.atan2(dy, dx);
      
      // Calculate positions for curved links
      return `M${d.source.x},${d.source.y} Q${(d.source.x + d.target.x) / 2 + 50 * Math.sin(angle)},${(d.source.y + d.target.y) / 2 - 50 * Math.cos(angle)} ${d.target.x},${d.target.y}`;
    });
    
    // Update link label positions
    linkLabel.attr("transform", function(d: any) {
      // Position the label in the middle of the curved link
      const mid = { 
        x: (d.source.x + d.target.x) / 2 + 30 * Math.sin(Math.atan2(d.target.y - d.source.y, d.target.x - d.source.x)), 
        y: (d.source.y + d.target.y) / 2 - 30 * Math.cos(Math.atan2(d.target.y - d.source.y, d.target.x - d.source.x))
      };
      return `translate(${mid.x},${mid.y})`;
    });
    
    // Update node positions
    node.attr("transform", function(d: any) {
      return `translate(${d.x},${d.y})`;
    });
  }
  
  // Drag functions
  function dragstarted(event: any, d: any) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }
  
  function dragged(event: any, d: any) {
    d.fx = event.x;
    d.fy = event.y;
  }
  
  function dragended(event: any, d: any) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }
}

export default FlowChart;