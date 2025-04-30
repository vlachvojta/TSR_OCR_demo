from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import uuid
import os
from typing import Dict, Any

from tsr_demo.data_manager import ProcessingState
# from libs.document_structure_analysis.table_transformer_baseline.baseline_table_enging import TableEngine

app = FastAPI(
    title="TSR demo",
    description="API and GUI for Table Structure Recognition (TSR) processing of images.",
    version="0.1.0",
)

# In-memory storage for demo purposes
# In a real application, you'd use a database
image_results: Dict[str, Any] = {}
image_results['example_page'] = {
    "status": ProcessingState.PROCESSED.value,
    "original_filename": "example_page.png",
    "input_image": "uploads/example_page/example_page.png",
    # "xml_content": None,
    "picture_id": 'example_page',
    "image_ext": '.png',
    "picture_dir": 'uploads/example_page',
    # "rendered_image": 'uploads/example_page/example_page_render.png',
}

image_results['example_loading'] = {
    "status": ProcessingState.DETECTING_TABLES.value,
    "original_filename": "example_page.png",
    "input_image": "uploads/example_page/example_page.png",
    "picture_id": 'example_page',
    "image_ext": '.png',
    # "rendered_image": 'uploads/example_loading/example_loading_render.png',
}

image_results['example_error'] = {
    "status": ProcessingState.ERROR.value,
    "original_filename": "example_page.png",
    "input_image": "uploads/example_page/example_page.png",
    "picture_id": 'example_page',
    "image_ext": '.png',
    # "rendered_image": 'uploads/example_error/example_error_render.png',
    "error_message": "An error occurred during processing.",
}

# Ensure upload directory exists
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Set up templates and static files
templates = Jinja2Templates(directory="tsr_demo/templates")
app.mount("/static", StaticFiles(directory="tsr_demo/static"), name="static")
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Initialize the TSR engine
# tsr_engine = TableEngine('uploads', 'libs/run_pero_ocr.sh')

# API endpoints
@app.post("/api/upload", summary="Upload an image for TSR processing")
async def upload_image(file: UploadFile = File(...)):
    """
    Upload an image file for TSR processing.
    
    Returns a picture ID that can be used to retrieve the processing results (after finished).
    """
    # Generate a unique ID for the image
    picture_id = str(uuid.uuid4())
    picture_dir = os.path.join(UPLOAD_DIR, picture_id)
    os.makedirs(picture_dir, exist_ok=True)

    # get image extension
    _, image_ext = os.path.splitext(file.filename)

    # Save the uploaded file
    file_path = os.path.join(picture_dir, f"{picture_id}{image_ext}")
    with open(file_path, "wb") as f:
        f.write(await file.read())

    # For now, just store dummy results
    image_results[picture_id] = {
        "status": ProcessingState.INPUT_CREATED.value,
        "original_filename": file.filename,
        "input_image": os.path.join(picture_id, f"{picture_id}{image_ext}"),  # Relative path for API response
        "picture_id": picture_id,
        "image_ext": image_ext,
        "picture_dir": picture_dir,
        # "rendered_image": os.path.join(picture_dir, f"{picture_id}_render.png"),
    }

    # TODO: run table structure recognition
    # tsr_engine.process_dir_async(picture_dir)

    return {"picture_id": picture_id}

@app.get("/api/results/{picture_id}", summary="Get image TSR results")
async def get_results(picture_id: str):
    """
    Retrieve the processing results for a previously uploaded image.
    
    Use the picture_id returned from the upload endpoint.
    """
    image_result = image_results.get(picture_id)
    if not image_result:
        raise HTTPException(status_code=404, detail="Image not found")

    # Check if the processing is complete
    if image_result["status"] != ProcessingState.PROCESSED.value:
        return image_result

    # send XML file in UPLOAD_DIR/picture_id/picture_id.xml
    xml_file_path = os.path.join(UPLOAD_DIR, picture_id, f"{picture_id}.xml")
    if os.path.exists(xml_file_path):
        with open(xml_file_path, "r") as f:
            xml_content = f.read()
        image_results[picture_id]["xml_content"] = xml_content[:200] + "..."
    else:
        image_results[picture_id]["status"] = "processing"

    return image_results[picture_id]

# Frontend routes
@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    """Serve the upload page"""
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/result/{picture_id}", response_class=HTMLResponse)
async def read_result(request: Request, picture_id: str):
    """Serve the result page"""
    return templates.TemplateResponse("result.html", {"request": request, "picture_id": picture_id})

# Favicon
@app.get('/favicon.ico', include_in_schema=False)
async def favicon():
    return FileResponse('static/favicon.ico')

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
