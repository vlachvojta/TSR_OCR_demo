document.addEventListener('DOMContentLoaded', () => {
    const uploadForm = document.getElementById('upload-form');
    const imageUpload = document.getElementById('image-upload');
    const imagePreview = document.getElementById('image-preview');
    const fileName = document.getElementById('file-name');
    const loading = document.getElementById('loading');
    const errorMessage = document.getElementById('error-message');

    // Handle file selection for preview
    imageUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            // Update file name display
            fileName.textContent = file.name;
            
            // Create a preview
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.src = e.target.result;
            };
            reader.readAsDataURL(file);
        } else {
            fileName.textContent = 'Choose an image file';
            // We still keep the placeholder image visible
            imagePreview.src = '/static/placeholder.png';
        }
    });

    // Handle form submission
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // MODIFIED: Removed the file validation check that was here
        // This allows submission even when no file is selected
        
        // Show loading state
        uploadForm.classList.add('hidden');
        loading.classList.remove('hidden');
        errorMessage.classList.add('hidden');
        
        try {
            const formData = new FormData();
            
            const file = imageUpload.files[0];
            if (file) {
                // If a file is selected, use it
                formData.append('file', file);
            } else {
                // If no file is selected, we'll need to fetch the placeholder and add it
                const placeholderResponse = await fetch('/static/placeholder.png');
                const placeholderBlob = await placeholderResponse.blob();
                
                // Create a File object from the blob
                const placeholderFile = new File(
                    [placeholderBlob], 
                    'placeholder.png', 
                    { type: 'image/png' }
                );
                
                formData.append('file', placeholderFile);
            }
            
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Redirect to results page
            window.location.href = `/result/${data.picture_id}`;
            
        } catch (error) {
            // Show error and revert to form
            uploadForm.classList.remove('hidden');
            loading.classList.add('hidden');
            showError(`Error: ${error.message}`);
        }
    });
    
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
    }
});
