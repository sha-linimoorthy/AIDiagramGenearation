from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import logging
from ollama import chat
from concurrent.futures import ThreadPoolExecutor

logging.basicConfig(
    filename='server.log',
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def generate_ollama_response(model, prompt):
    messages = [
        {'role': 'system', 'content': ''},
        {'role': 'user', 'content': prompt}
    ]    
    response = chat(model=model, messages=messages)
    return response['message']['content']

executor = ThreadPoolExecutor(max_workers=20)

@app.post("/api/charts-parse")
async def parse_chart_request(request: Request):
    try:
        data = await request.json()
        prompt = data.get("prompt")
        chart_type = data.get("chartType", "default")
        model = "qwen2.5:7b-instruct"

        if not prompt:
            raise HTTPException(status_code=400, detail="Missing required fields")

        # Format prompt based on chart type
        if chart_type == "bar":
            formatted_prompt = f"""
            Parse the following bar chart request into a structured JSON format:
            {prompt}
            
            Return a JSON object with the following structure:
            {{
                "title": "Chart title",
                "xAxisLabel": "X-Axis Label",
                "yAxisLabel": "Y-Axis Label",
                "data": [
                    {{ "label": "Category A", "value": 25, "category": "Group 1" }},
                    {{ "label": "Category B", "value": 50, "category": "Group 2" }}
                ]
            }}
            
            Only respond with valid JSON, no additional text.
            """
        elif chart_type == "gantt":
            formatted_prompt = f"""
            Parse the following Gantt chart request into a structured JSON format:
            {prompt}

            Return a JSON object with the following structure:
            {{
            "title": "Chart title",
            "tasks": [
                {{
                "id": 1,
                "name": "Task name",
                "start": "2023-03-01",
                "end": "2023-03-15",
                "dependencies": [2, 3],
                "category": "Planning"
                }}
            ]
            }}

            Only respond with valid JSON, no additional text."""



        elif chart_type == "pie":
            formatted_prompt = f"""
            Parse the following pie chart request into a structured JSON format:
            {prompt}
            
            Return a JSON object with the following structure:
            {{
                "title": "Chart title",
                "data": [
                    {{ "label": "Category A", "value": 25, "color": "#4338CA" }},
                    {{ "label": "Category B", "value": 75, "color": "#3B82F6" }}
                ]
            }}
            
            Only respond with valid JSON, no additional text. Ensure values sum to 100.
            """
        elif chart_type == "line":
            formatted_prompt = f""" 
            Parse the following line chart request into a structured JSON format:
          {prompt}
          
          Return a JSON object with the following structure:
          {{
            "title": "Chart title",
            "xAxisLabel": "X-Axis Label",
            "yAxisLabel": "Y-Axis Label",
            "data": [
              {{
                "label": "Jan",
                "value": "25",
                "category": "Temperature"
              }},
              {{
                "label": "Feb",
                "value": "30",
                "category": "Temperature"
              }}
            ]
          }}
          
          Only respond with valid JSON, no additional text.
            """
        
        elif chart_type == "flow":
            formatted_prompt = f"""
             Parse the following flow chart request into a structured JSON format:
          ${prompt}
          
          Return a JSON object with the following structure:
          {{
            "title": "Chart title",
            "nodes": [
              {{
                "id": "1",
                "label": "Start",
                "type": "start"
              }},
              {{
                "id": "2",
                "label": "Process",
                "type": "process"
              }},
              {{
                "id": "3",
                "label": "End",
                "type": "end"
              }}
            ],
            "links": [
              {{
                "source": "1",
                "target": "2",
                "label": "Next"
              }},
              {{
                "source": "2",
                "target": "3",
                "label": "Complete"
              }}
            ]
          }}
          
          Only respond with valid JSON, no additional text."""
        else:
            formatted_prompt = f"""
            Parse the following chart request into a structured JSON format:
            {prompt}
            
            Return a structured JSON response based on the provided request.
            """

        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            executor, generate_ollama_response, model, formatted_prompt
        )

        logging.info(f"Processed request for chart type: {chart_type}")
        logging.info(f"Response: {response}")
        return JSONResponse(content={"response": response})

    except Exception as e:
        logging.error(f"Error processing /api/charts-parse: {str(e)}")
        return JSONResponse(content={"error": str(e)}, status_code=500)

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, port=3000)
