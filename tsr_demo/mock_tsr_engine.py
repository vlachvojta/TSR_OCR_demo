import logging
import asyncio

from tsr_demo.data_manager import ProcessingState, DataManager

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class MockTSREngine:
    async def process_image_async(self, picture_id: str, data_manager: DataManager):
        """Process the image asynchronously."""
        logger.info(f"MOCK_TSR: Starting processing for {picture_id}")
        try:
            # Update state to processing_ocr
            data_manager.update_state(picture_id, ProcessingState.PROCESSING_OCR)
            logger.info(f"MOCK_TSR: Processing OCR for {picture_id}")
            
            # Simulate OCR processing
            await asyncio.sleep(2)
            
            # Update state to detecting_tables
            data_manager.update_state(picture_id, ProcessingState.DETECTING_TABLES)
            logger.info(f"MOCK_TSR: Detecting tables for {picture_id}")
            
            # Simulate table detection
            await asyncio.sleep(3)
            
            # Update state to recognizing_table_structure
            data_manager.update_state(picture_id, ProcessingState.RECOGNIZING_TABLE_STRUCTURE)
            
            logger.info(f"MOCK_TSR: Recognizing table structure for {picture_id}")
            # Simulate table structure recognition
            await asyncio.sleep(1)
            
            # Save XML result (mock result for demonstration)
            xml_content = f"""<?xml version="1.0" encoding="UTF-8"?>
            <TSRResult>
                <ProcessedImage>{picture_id}</ProcessedImage>
                <TableCount>2</TableCount>
                <Tables>
                    <Table id="1">
                        <Rows>5</Rows>
                        <Columns>3</Columns>
                    </Table>
                    <Table id="2">
                        <Rows>7</Rows>
                        <Columns>2</Columns>
                    </Table>
                </Tables>
            </TSRResult>
            """
            logger.info(f"MOCK_TSR: Saving XML result for {picture_id}")
            data_manager.save_xml_result(picture_id, xml_content)
            
            logger.info(f"MOCK_TSR: Processing completed for {picture_id}")
            # Update state to processed with results
            data_manager.update_state(picture_id, ProcessingState.PROCESSED) #, results)
        
        except Exception as e:
            # Update state to error
            data_manager.update_state(
                picture_id, 
                ProcessingState.ERROR, 
                {"error": str(e)}
            )
