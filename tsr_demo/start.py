from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import uuid
import logging
import os
from typing import Dict, Any
import asyncio

from tsr_demo.data_manager import ProcessingState, DataManager
from tsr_demo.mock_tsr_engine import MockTSREngine
# from libs.document_structure_analysis.table_transformer_baseline.baseline_table_enging import TableEngine

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="TSR demo",
    description="API and GUI for Table Structure Recognition (TSR) processing of images.",
    version="0.1.0",
)

# Ensure upload directory exists
UPLOAD_DIR = "uploads"
data_manager = DataManager(UPLOAD_DIR)

# Set up templates and static files
templates = Jinja2Templates(directory="tsr_demo/templates")
app.mount("/static", StaticFiles(directory="tsr_demo/static"), name="static")
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Initialize the TSR engine
# tsr_engine = TableEngine('uploads', 'libs/run_pero_ocr.sh')
tsr_engine = MockTSREngine()

# API endpoints
@app.post("/api/upload", summary="Upload an image for TSR processing")
async def upload_image(file: UploadFile = File(...)):
    """
    Upload an image file for TSR processing.
    
    Returns a picture ID that can be used to retrieve the processing results (after finished).
    """
    # Generate a unique ID for the image
    picture_id = str(uuid.uuid4())
    
    # Save the uploaded file and create initial state
    await data_manager.save_upload(picture_id, file)
    
    # Start processing asynchronously
    asyncio.create_task(tsr_engine.process_image_async(picture_id, data_manager))
    
    return {"picture_id": picture_id}

@app.get("/api/results/{picture_id}", summary="Get image TSR results")
async def get_results(picture_id: str):
    """
    Retrieve the processing results for a previously uploaded image.
    
    Use the picture_id returned from the upload endpoint.
    """
    result = data_manager.get_result(picture_id)

    if not result:
        raise HTTPException(status_code=404, detail="Image not found")

    if result.status == ProcessingState.PROCESSED:
        return data_manager.get_result('example_page')  # return example page for demo purposes
    
    return result

# Frontend routes
@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    """Serve the upload page"""
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/result/{picture_id}", response_class=HTMLResponse)
async def read_result(request: Request, picture_id: str):
    """Serve the result page"""
    return templates.TemplateResponse("result.html", {"request": request, "picture_id": picture_id})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
