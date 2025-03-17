import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { geminiRequestSchema, ganttChartDataSchema } from "@shared/schema";
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

      // Prepare the request to Gemini API
      const geminiPrompt = `
        Parse the following ${chartType} chart request into a structured JSON format:
        ${prompt}
        
        Return a JSON object with the following structure for a Gantt chart:
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
        
        // Validate the parsed data against our schema
        const validatedChartData = ganttChartDataSchema.parse(jsonData);
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
