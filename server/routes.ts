import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  geminiRequestSchema, 
  ganttChartDataSchema,
  barChartDataSchema,
  pieChartDataSchema
} from "@shared/schema";
import { z } from "zod";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

interface GeminiGenerateContentResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // API route for generating chart data from natural language using Gemini API
  app.post('/api/generate-chart', async (req, res) => {
    try {
      console.log("Received chart generation request:", req.body);
      
      // Validate request body
      const validatedData = geminiRequestSchema.parse(req.body);
      const { prompt, chartType } = validatedData;

      // Get the Gemini API key from environment variables
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.error("Gemini API key not configured");
        return res.status(500).json({ 
          message: "Gemini API key is not configured. Please set the GEMINI_API_KEY environment variable." 
        });
      }

      // Prepare the request to Gemini API based on chart type
      let geminiPrompt = '';
      
      if (chartType === 'gantt') {
        geminiPrompt = `
          Parse the following Gantt chart request into a structured JSON format:
          ${prompt}
          
          Return a JSON object with the following structure:
          {
            "title": "Chart title",
            "tasks": [
              {
                "id": 1,
                "name": "Task name",
                "start": "2023-03-01",
                "end": "2023-03-15",
                "dependencies": [2, 3],
                "category": "Planning"
              }
            ]
          }
          
          Only respond with valid JSON, no additional text.
        `;
      } else if (chartType === 'bar') {
        geminiPrompt = `
          Parse the following bar chart request into a structured JSON format:
          ${prompt}
          
          Return a JSON object with the following structure:
          {
            "title": "Chart title",
            "xAxisLabel": "X-Axis Label",
            "yAxisLabel": "Y-Axis Label",
            "data": [
              {
                "label": "Category A",
                "value": 25,
                "category": "Group 1"
              },
              {
                "label": "Category B",
                "value": 50,
                "category": "Group 2"
              }
            ]
          }
          
          Only respond with valid JSON, no additional text.
        `;
      } else if (chartType === 'pie') {
        geminiPrompt = `
          Parse the following pie chart request into a structured JSON format:
          ${prompt}
          
          Return a JSON object with the following structure:
          {
            "title": "Chart title",
            "data": [
              {
                "label": "Category A",
                "value": 25,
                "color": "#4338CA"
              },
              {
                "label": "Category B",
                "value": 75,
                "color": "#3B82F6"
              }
            ]
          }
          
          Only respond with valid JSON, no additional text. Make sure all values add up to 100 for pie chart percentages.
        `;
      } else if (chartType === 'line') {
        geminiPrompt = `
          Parse the following line chart request into a structured JSON format:
          ${prompt}
          
          Return a JSON object with the following structure:
          {
            "title": "Chart title",
            "xAxisLabel": "X-Axis Label",
            "yAxisLabel": "Y-Axis Label",
            "data": [
              {
                "label": "Jan",
                "value": 25,
                "category": "Temperature"
              },
              {
                "label": "Feb",
                "value": 30,
                "category": "Temperature"
              }
            ]
          }
          
          Only respond with valid JSON, no additional text.
        `;
      } else if (chartType === 'flow') {
        geminiPrompt = `
          Parse the following flow chart request into a structured JSON format:
          ${prompt}
          
          Return a JSON object with the following structure:
          {
            "title": "Chart title",
            "nodes": [
              {
                "id": "1",
                "label": "Start",
                "type": "start"
              },
              {
                "id": "2",
                "label": "Process",
                "type": "process"
              },
              {
                "id": "3",
                "label": "End",
                "type": "end"
              }
            ],
            "links": [
              {
                "source": "1",
                "target": "2",
                "label": "Next"
              },
              {
                "source": "2",
                "target": "3",
                "label": "Complete"
              }
            ]
          }
          
          Only respond with valid JSON, no additional text.
        `;
      } else {
        return res.status(400).json({
          message: `Unsupported chart type: ${chartType}. Supported types are: gantt, bar, pie, line, flow`
        });
      }

      console.log("Sending request to Gemini API with prompt:", prompt);

      const geminiRequestBody = {
        contents: [{
          parts: [{ text: geminiPrompt }]
        }]
      };

      try {
        // Call Gemini API
        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(geminiRequestBody),
          }
        );

        if (!geminiResponse.ok) {
          const errorText = await geminiResponse.text();
          console.error("Gemini API error response:", errorText);
          return res.status(geminiResponse.status).json({ 
            message: `Failed to get response from Gemini API: ${errorText}` 
          });
        }

        const geminiData = await geminiResponse.json() as GeminiGenerateContentResponse;
        console.log("Received response from Gemini API:", JSON.stringify(geminiData));
        
        if (!geminiData.candidates || geminiData.candidates.length === 0) {
          console.error("No candidates in Gemini API response");
          return res.status(400).json({ 
            message: "No valid response from Gemini API" 
          });
        }

        // Extract the text from the response
        const responseText = geminiData.candidates[0].content.parts[0].text;
        console.log("Raw response text:", responseText);
        
        // Extract JSON from the response text
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.error("Could not extract JSON from response");
          return res.status(400).json({ 
            message: "Could not extract valid JSON from Gemini API response" 
          });
        }

        // Parse the extracted JSON
        const jsonData = JSON.parse(jsonMatch[0]);
        console.log("Parsed JSON data:", jsonData);
        
        // Validate the parsed data against the appropriate schema based on chart type
        let validatedChartData;
        
        if (chartType === 'gantt') {
          validatedChartData = ganttChartDataSchema.parse(jsonData);
        } else if (chartType === 'bar') {
          validatedChartData = barChartDataSchema.parse(jsonData);
        } else if (chartType === 'pie') {
          validatedChartData = pieChartDataSchema.parse(jsonData);
        } else if (chartType === 'line') {
          // For now, use the bar chart schema for line charts as they have similar structure
          validatedChartData = barChartDataSchema.parse(jsonData);
        } else if (chartType === 'flow') {
          // For flow charts, we'll temporarily pass through the data without validation
          // In a production environment, we would create a proper flow chart schema
          validatedChartData = jsonData;
        } else {
          throw new Error(`Unsupported chart type: ${chartType}`);
        }
        
        console.log("Validated chart data:", validatedChartData);
        
        // Return the validated data
        return res.status(200).json(validatedChartData);
      } catch (error) {
        if (error instanceof SyntaxError) {
          console.error("JSON syntax error:", error);
          return res.status(400).json({ 
            message: "Invalid JSON in Gemini API response" 
          });
        }
        if (error instanceof ZodError) {
          const validationError = fromZodError(error);
          console.error("Zod validation error:", validationError);
          return res.status(400).json({ 
            message: `Chart data validation error: ${validationError.message}` 
          });
        }
        console.error("Error calling Gemini API:", error);
        return res.status(500).json({ 
          message: "Failed to process chart data" 
        });
      }
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        console.error("Request validation error:", validationError);
        return res.status(400).json({ 
          message: `Request validation error: ${validationError.message}` 
        });
      }
      console.error("Unexpected error:", error);
      return res.status(500).json({ 
        message: "Internal server error" 
      });
    }
  });

  // API route for saving a chart
  app.post('/api/charts', async (req, res) => {
    try {
      // TODO: Add authentication to associate charts with users
      // For now, we'll just save the chart without a user ID
      
      const { title, type, data } = req.body;
      
      // Validate chart data based on type
      if (type === 'gantt') {
        ganttChartDataSchema.parse(data);
      } else if (type === 'bar') {
        barChartDataSchema.parse(data);
      } else if (type === 'pie') {
        pieChartDataSchema.parse(data);
      } else if (type === 'line') {
        // For now, use the bar chart schema for line charts as they have similar structure
        barChartDataSchema.parse(data);
      } else if (type === 'flow') {
        // For flow charts, we'll temporarily accept all data 
        // In a production environment, we would create a proper flow chart schema
      } else {
        return res.status(400).json({
          message: `Unsupported chart type: ${type}. Supported types are: gantt, bar, pie, line, flow`
        });
      }
      
      // Save chart to database
      const chart = await storage.createChart({ title, type, data, userId: null });
      
      return res.status(201).json(chart);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ 
          message: `Chart validation error: ${validationError.message}` 
        });
      }
      console.error("Error saving chart:", error);
      return res.status(500).json({ 
        message: "Failed to save chart" 
      });
    }
  });

  // API route for getting all charts (or filtered by user)
  app.get('/api/charts', async (req, res) => {
    try {
      // TODO: Add authentication to filter charts by user
      const charts = await storage.getAllCharts();
      return res.status(200).json(charts);
    } catch (error) {
      console.error("Error fetching charts:", error);
      return res.status(500).json({ 
        message: "Failed to fetch charts" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
