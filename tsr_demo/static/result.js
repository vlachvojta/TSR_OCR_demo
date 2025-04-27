document.addEventListener('DOMContentLoaded', () => {
    const resultsContainer = document.getElementById('results');
    const loading = document.getElementById('loading');
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
        // Hide loading
        loading.classList.add('hidden');
        resultsContainer.classList.remove('hidden');
        
        // Set the original image
        if (data.file_path) {
            originalImage.src = `/${data.rendered_image}`;
        }
        
        // Format and display the JSON data
        resultData.textContent = JSON.stringify(data, null, 2);
    }
    
    function showError(message) {
        loading.classList.add('hidden');
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
    }
});