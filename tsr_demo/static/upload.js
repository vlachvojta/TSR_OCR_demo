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
            imagePreview.src = '/static/placeholder.png';
        }
    });

    // Handle form submission
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const file = imageUpload.files[0];
        if (!file) {
            showError('Please select an image file');
            return;
        }
        
        // Show loading state
        uploadForm.classList.add('hidden');
        loading.classList.remove('hidden');
        errorMessage.classList.add('hidden');
        
        try {
            const formData = new FormData();
            formData.append('file', file);
            
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
