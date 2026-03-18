# ai_building_detection_service.py
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from typing import List
import uvicorn

app = FastAPI()

@app.post("/detect-buildings")
async def detect_buildings(image: UploadFile = File(...)):
    # TODO: Run YOLOv8/Detectron2/Microsoft model on image
    # For now, return a mock response
    return JSONResponse({
        "buildings": [
            {
                "latitude": 6.664437,
                "longitude": 3.490537,
                "building_polygon": [[6.6644, 3.4905], [6.6645, 3.4906], [6.6646, 3.4905]],
                "confidence_score": 0.98
            }
        ]
    })

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
