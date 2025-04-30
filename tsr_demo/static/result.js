'use strict';

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

    let pollingInterval;

    async function fetchResults(id) {
        const response = await fetch(`/api/results/${id}`);
        
        if (!response.ok) {
            throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        // Display the results
        displayResults(data);
        // If the status is not 'processed' or 'error', poll again after a delay
        if (data.status !== 'processed' && data.status !== 'error') {
            if (!pollingInterval) {
                pollingInterval = setInterval(() => fetchResults(id), 250); // Poll every 250ms
            }
        } else {
            // Stop polling when processing is complete
            if (pollingInterval) {
                clearInterval(pollingInterval);
                pollingInterval = null;
            }
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

            const link = statusToLink(data.status);
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

    // Clean up interval when leaving the page
    window.addEventListener('beforeunload', () => {
        if (pollingInterval) {
            clearInterval(pollingInterval);
        }
    });
});
