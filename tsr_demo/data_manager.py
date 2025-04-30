import os
import json
import enum
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
import shutil
from fastapi import UploadFile
import logging
from datetime import datetime

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ProcessingState(str, enum.Enum):
    """Enum for the different processing states of an image."""
    INPUT_CREATED = "Input created"
    PROCESSING_OCR = "Processing OCR (Optical Character Recognition)"
    DETECTING_TABLES = "Detecting tables"
    RECOGNIZING_TABLE_STRUCTURE = "Recognizing table structure"
    CONSTRUCTING_TABLE = "Constructing table"
    PROCESSED = "processed"
    ERROR = "error"  # Added an error state for robustness

class ImageProcessingResult(BaseModel):
    """Pydantic model for the image processing result."""
    picture_id: str
    status: ProcessingState = Field(default=ProcessingState.INPUT_CREATED)
    original_filename: str
    input_image: str
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())
    finished_at: Optional[str] = None
    error_message: Optional[str] = None
    xml_content: Optional[str] = None
    results: Optional[Dict[str, Any]] = None

class TsrResultDto(ImageProcessingResult):
    xml_content: Optional[str] = Field(None, description="XML content of the processing result")

class DataManager:
    """Class to manage data persistence across multiple FastAPI instances."""
    
    def __init__(self, base_upload_dir: str = "uploads"):
        """Initialize the data manager with the upload directory."""
        self.base_upload_dir = base_upload_dir
        os.makedirs(base_upload_dir, exist_ok=True)
        logger.info(f"DataManager initialized with base directory: {base_upload_dir}")
    
    def _get_picture_dir(self, picture_id: str) -> str:
        """Get the directory for a specific picture."""
        picture_dir = os.path.join(self.base_upload_dir, picture_id)
        os.makedirs(picture_dir, exist_ok=True)
        return picture_dir
    
    def _get_state(self, picture_id: str) -> str:
        """Get the path to the state file for a specific picture."""
        picture_dir = self._get_picture_dir(picture_id)
        return os.path.join(picture_dir, f"{picture_id}_state.json")
    
    async def save_upload(self, picture_id: str, file: UploadFile) -> ImageProcessingResult:
        """Save an uploaded file and create initial state."""
        logger.debug(f"Saving upload for picture_id: {picture_id}")

        try:
            # Get picture directory
            picture_dir = self._get_picture_dir(picture_id)
            logger.debug(f"Picture directory: {picture_dir}")
            
            # Extract file extension
            _, ext = os.path.splitext(file.filename)
            
            # Define file path for the uploaded image
            input_image = os.path.join(picture_dir, f"{picture_id}{ext}")
            logger.debug(f"Input image path: {input_image}")
            
            # Save the file
            with open(input_image, "wb") as f:
                f.write(await file.read())
            
            # Create the result object
            result = ImageProcessingResult(
                picture_id=picture_id,
                status=ProcessingState.INPUT_CREATED,
                original_filename=file.filename,
                input_image=input_image  # Relative path for API response
            )
            
            # Save the state
            self._save_state(result)
            
            logger.info(f"Saved upload for picture_id: {picture_id}")
            return result
            
        except Exception as e:
            logger.error(f"Error saving upload for picture_id {picture_id}: {str(e)}")
            # Create error result
            error_result = ImageProcessingResult(
                picture_id=picture_id,
                status=ProcessingState.ERROR,
                error_message=f"Error saving upload: {str(e)}"
            )
            self._save_state(error_result)
            return error_result
    
    def get_result(self, picture_id: str) -> Optional[TsrResultDto]:
        """Get the processing result for a specific picture."""
        try:
            state_file = self._get_state(picture_id)
            
            if not os.path.exists(state_file):
                logger.warning(f"State file not found for picture_id: {picture_id}")
                return None
            
            with open(state_file, "r") as f:
                state_data = json.load(f)

            # Convert to Pydantic model
            result = TsrResultDto(**state_data)
            result.xml_content = self._get_xml_content(picture_id)

            return result
            
        except Exception as e:
            logger.error(f"Error getting result for picture_id {picture_id}: {str(e)}")
            return None
    
    def update_state(self, picture_id: str, new_state: ProcessingState, results: Optional[Dict[str, Any]] = None) -> Optional[ImageProcessingResult]:
        """Update the processing state for a specific picture."""
        try:
            # Get current state
            current = self.get_result(picture_id)
            if not current:
                logger.warning(f"Cannot update state for non-existent picture_id: {picture_id}")
                return None
            
            # Update state
            current.status = new_state
            if results is not None:
                current.results = results

            # If the state is finished, set finished_at
            if new_state in [ProcessingState.PROCESSED]:
                current.finished_at = datetime.now().isoformat()
                self._save_state(current)
                logger.info(f"Finished processing for picture_id {picture_id} at {current.finished_at}")
            
            # Save updated state
            self._save_state(current)
            
            logger.info(f"Updated state for picture_id {picture_id} to {new_state}")
            return current
            
        except Exception as e:
            logger.error(f"Error updating state for picture_id {picture_id}: {str(e)}")
            return None
    
    def save_xml_result(self, picture_id: str, xml_content: str) -> bool:
        """Save XML result of TSR processing."""
        try:
            picture_dir = self._get_picture_dir(picture_id)
            xml_path = os.path.join(picture_dir, f"{picture_id}.xml")
            
            with open(xml_path, "w", encoding="utf-8") as f:
                f.write(xml_content)
            
            logger.info(f"Saved XML result for picture_id: {picture_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error saving XML for picture_id {picture_id}: {str(e)}")
            return False
    
    def _get_xml_content(self, picture_id: str) -> Optional[str]:
        """Get the XML result for a specific picture."""
        try:
            picture_dir = self._get_picture_dir(picture_id)
            xml_path = os.path.join(picture_dir, f"{picture_id}.xml")
            
            if not os.path.exists(xml_path):
                logger.warning(f"XML file not found for picture_id: {picture_id}")
                return None
            
            with open(xml_path, "r", encoding="utf-8") as f:
                return f.read()
                
        except Exception as e:
            logger.error(f"Error reading XML for picture_id {picture_id}: {str(e)}")
            return None
    
    def _save_state(self, result: ImageProcessingResult) -> None:
        """Save the state to the file system."""
        try:
            state_file = self._get_state(result.picture_id)
            
            # Convert to dict and save as JSON
            with open(state_file, "w") as f:
                json.dump(result.dict(), f, indent=2)
                
        except Exception as e:
            logger.error(f"Error saving state for picture_id {result.picture_id}: {str(e)}")
    
    def delete_picture_data(self, picture_id: str) -> bool:
        """Delete all data for a specific picture."""
        try:
            picture_dir = self._get_picture_dir(picture_id)
            
            if os.path.exists(picture_dir):
                shutil.rmtree(picture_dir)
                logger.info(f"Deleted all data for picture_id: {picture_id}")
                return True
            else:
                logger.warning(f"No data found to delete for picture_id: {picture_id}")
                return False
                
        except Exception as e:
            logger.error(f"Error deleting data for picture_id {picture_id}: {str(e)}")
            return False
