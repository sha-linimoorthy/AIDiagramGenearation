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

export async function registerRoutes(app: Express): Promise<Server> {
  app.post('/api/generate-chart', async (req, res) => {
    try {
      console.log("Received chart generation request:", req.body);
      
      const validatedData = geminiRequestSchema.parse(req.body);
      const { prompt, chartType } = validatedData;
      console.log(prompt);
      console.log(chartType);
      const requestBody = {
        prompt,
        chartType
      };

      console.log("Sending request to charts-parse API with payload:", requestBody);

      const response = await fetch("http://127.0.0.1:8000/api/charts-parse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API error response:", errorText);
        return res.status(response.status).json({ 
          message: `Failed to get response from charts-parse API: ${errorText}` 
        });
      }

      const jsonDataRaw = await response.json();
      let jsonData;
if (typeof jsonDataRaw.response === "string") {
  try {
    // First attempt: try parsing the raw response directly
    jsonData = JSON.parse(jsonDataRaw.response);
  } catch (error) {
    // Second attempt: try cleaning the string from markdown code blocks
    const cleanedResponse = jsonDataRaw.response
      .replace(/```json\s*/, '')  // Remove opening ```json with any whitespace
      .replace(/\s*```$/, '')     // Remove closing ``` with any preceding whitespace
      .trim();
    
    try {
      jsonData = JSON.parse(cleanedResponse);
    } catch (innerError) {
      console.error("Failed to parse JSON after cleaning:", innerError);
      return res.status(400).json({ 
        message: "Invalid JSON format in API response after cleaning" 
      });
    }
  }
} else {
  jsonData = jsonDataRaw.response || jsonDataRaw;
}
      let validatedChartData;
      if (chartType === 'gantt') {
        validatedChartData = ganttChartDataSchema.parse(jsonData);
      } else if (chartType === 'bar') {
        validatedChartData = barChartDataSchema.parse(jsonData);
      } else if (chartType === 'pie') {
        validatedChartData = pieChartDataSchema.parse(jsonData);
      } else if (chartType === 'line') {
        validatedChartData = barChartDataSchema.parse(jsonData);
      } else if (chartType === 'flow') {
        validatedChartData = jsonData;
      } else {
        return res.status(400).json({
          message: `Unsupported chart type: ${chartType}`
        });
      }

      console.log("Validated chart data:", validatedChartData);
      return res.status(200).json(validatedChartData);
    } catch (error) {
      if (error instanceof SyntaxError) {
        console.error("JSON syntax error:", error);
        return res.status(400).json({ 
          message: "Invalid JSON in API response" 
        });
      }
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        console.error("Zod validation error:", validationError);
        return res.status(400).json({ 
          message: `Chart data validation error: ${validationError.message}` 
        });
      }
      console.error("Error calling charts-parse API:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  return createServer(app);
}
