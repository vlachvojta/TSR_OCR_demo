document.addEventListener('DOMContentLoaded', () => {
    const resultsContainer = document.getElementById('results');
    const loading = document.getElementById('loading');
    const loading_text = document.getElementById('loading-text');
    const errorMessage = document.getElementById('error-message');
    const resultData = document.getElementById('result-data');
    const originalImage = document.getElementById('original-image');
    
    // Extract the picture ID from the URL
    const path = window.location.pathname;
    const pictureId = path.split('/').pop();
    
    // Fetch the results
    fetchResults(pictureId);
    
    async function fetchResults(id) {
        try {
            const response = await fetch(`/api/results/${id}`);
            
            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            // Display the results
            displayResults(data);

        } catch (error) {
            showError(`Error: ${error.message}`);
        }
    }
    
    function displayResults(data) {
        if (data.input_image) {
            originalImage.src = `/${data.input_image}`;
        }
        resultsContainer.classList.remove('hidden');
        // Format and display the JSON data
        resultData.textContent = JSON.stringify(data, null, 2);

        /// check status, if error, show error message. If not processed, show current status and loading spinner
        if (data.status === 'error') {
            showError(`Error occured on backend: ${data.error_message}`);
            return;
        } else if (data.status !== 'processed') {
            loading_text.textContent = `${data.status}`;
            
            link = statusToLink(data.status);
            // if link is not null, show the link
            if (link) {
                loading_text.innerHTML = `${data.status} using <a href="${link.link}" target="_blank" rel="noopener noreferrer">${link.text}</a>`;
            } else {
                loading_text.textContent = `${data.status}`;
            }
            return;
        }

        // Hide loading
        loading.classList.add('hidden');
        
    }
    
    function showError(message) {
        loading.classList.add('hidden');
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
    }

    function statusToLink(status) {
        // if status starts with "Processing OCR", return 
        if (status.startsWith('Processing OCR')) {
            return {
                'text': '  pero_ocr',
                'link': 'https://github.com/DCGM/pero-ocr'
            }
        } else if (status.startsWith('Detecting tables')) {
            return {
                'text': '🤗 Microsoft table transformer detector',
                'link': 'https://huggingface.co/microsoft/table-transformer-detection'
            }
        } else if (status.startsWith('Recognizing table structure')) {
            return {
                'text': '🤗 Microsoft table transformer',
                'link': 'https://huggingface.co/microsoft/table-transformer-structure-recognition'
            }
        }
        return null;
    }



    // INPUT_CREATED = "Input created"
    // PROCESSING_OCR = 'Processing OCR (Optical Character Recognition) using <a href="https://github.com/DCGM/pero-ocr" target="_blank" rel="noopener noreferrer">pero-ocr</a>'
    // DETECTING_TABLES = 'Detecting tables in the image using <a href="https://huggingface.co/microsoft/table-transformer-detection" target="_blank" rel="noopener noreferrer">Microsot table transformer detector</a>'
    // RECOGNIZING_TABLE_STRUCTURE = 'Recognizing table structure <a href="https://huggingface.co/microsoft/table-transformer-structure-recognition" target="_blank" rel="noopener noreferrer">Microsot table transformer</a>'
    // PROCESSED = "processed"
    // ERROR = "error"  # Added an error state for robustness

});