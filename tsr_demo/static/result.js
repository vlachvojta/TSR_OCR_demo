'use strict';

document.addEventListener('DOMContentLoaded', () => {
    const resultsContainer = document.getElementById('results');
    const loading = document.getElementById('loading');
    const loading_text = document.getElementById('loading-text');
    const errorMessage = document.getElementById('error-message');
    const resultData = document.getElementById('result-data');
    const originalImage = document.getElementById('original-image');
    const mapContainer = document.getElementById('map');
    const textlineTranscriptions = document.getElementById('textline-transcriptions');
    const downloadXmlLink = document.getElementById('download-xml-link');
    const tableRestuls = document.getElementById('table-results');
    
    // Extract the picture ID from the URL
    const path = window.location.pathname;
    const pictureId = path.split('/').pop();
    
    // Single polling interval reference - defined at the top level
    let pollingInterval = null;
    
    // Start the initial fetch - only called once
    fetchResults(pictureId);
    
    async function fetchResults(id) {
        try {
            console.log('Fetching results for ID:', id);
            const response = await fetch(`/api/results/${id}`);
            
            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('Fetched data status:', data.status);
            
            // Display the results
            displayResults(data);

            // Handle polling based on status
            if (data.status === 'processed' || data.status === 'error') {
                console.log('Processing complete or error occurred. Stopping polling.');
                // Stop polling when processing is complete
                if (pollingInterval) {
                    console.log('Clearing polling interval.');
                    clearInterval(pollingInterval);
                    pollingInterval = null;
                }
            } else {
                // Only set up polling if it's not already in progress
                if (!pollingInterval) {
                    console.log('Setting up polling interval.');
                    pollingInterval = setInterval(() => {
                        fetchResults(id);
                    }, 500);
                }
            }
        } catch (error) {
            if (error.message !== 'Map container is already initialized.') {
                console.error('Error fetching results:', error);
                showError(`Error: ${error.message}`);
            }
            
            // Clear interval on error as well
            if (pollingInterval) {
                clearInterval(pollingInterval);
                pollingInterval = null;
            }
        }
    }

    function cut_off_string(str, max_length) {
        if (! str) {
            return 'No content available';
        }

        if (str.length > max_length) {
            return str.substring(0, max_length) + '...';
        }
        return str;
    }

    function displayResults(data) {
        if (data.input_image) {
            originalImage.src = `/${data.input_image}`;
        }
        resultsContainer.classList.remove('hidden');

        console.log('html_tables:', data.html_tables);
        console.log('html_tables type:', typeof data.html_tables);

        const html_tables_shortened = data.html_tables ? Object.keys(data.html_tables)
            .map((key) => {
                return {
                    [key]: cut_off_string(data.html_tables[key], 300)
                };
            }) : 'No HTML tables available';
        console.log('html_tables shortened:', html_tables_shortened);

        // Format and display the JSON data
        const xml_content = data.xml_content ? data.xml_content : 'No XML content available';
        // copy data to new object, shorten xml_content to max 500 characters
        const dataToDisplay = {
            ...data,
            xml_content: cut_off_string(xml_content, 500),
            html_tables: html_tables_shortened,
        };
        resultData.textContent = JSON.stringify(dataToDisplay, null, 1);
        downloadXmlLink.href = '../' + data.xml_filename;

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
        } else if (data.status === 'processed') {
            // Hide loading
            loading.classList.add('hidden');
            textlineTranscriptions.classList.remove('hidden');
            mapContainer.classList.remove('hidden');
            downloadXmlLink.classList.remove('hidden');
            tableRestuls.classList.remove('hidden');
            // const textlineTranscriptionsContainer = document.getElementById('textline-transcriptions');
            // const tableResultsContainer = document.getElementById('table-results');
            // textlineTranscriptionsContainer.classList.remove('hidden');
            // tableResultsContainer.classList.remove('hidden');
            // textline-transcriptions-container
            // table-results-container
            leafletInit(data);

            // count tables is synchronous
            const table_count = countTables(data.xml_content);
            console.log('Table count in XML:', table_count);    

            return;
        }
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

    function leafletInit(data) {
        console.log('Initializing Leaflet map with data:', data);

        // // Check if Leaflet is already initialized
        // if (window.map) {
        //     console.log('Leaflet map already initialized. Skipping initialization.');
        //     return;
        // } //else {
        // }
        // console.log('Leaflet map not initialized. Proceeding with initialization.');
        // Initialize the map
        window.map = L.map(mapContainer, {
            crs: L.CRS.Simple,
            minZoom: -3
        });
        
        // load data.input_image to get width and height
        const img = new Image();
        img.src = `/${data.input_image}`;
        
        img.onload = leafletOnLoadImage.bind(null, data, window.map, img);
        img.onerror = function() {
            const error_message = 'Error loading image. Please check the image path: ' + data.input_image;
            console.error(error_message);
            showError(error_message);

            // display placeholder to originalImage
            originalImage.src = '/static/placeholder.png';
            originalImage.alt = 'Placeholder image';

            // change originalImage to a link to homepage (so the user can see the placeholder and cursor changes to hand on hover, same as <a> and <button> automatically)
            originalImage.style.cursor = 'pointer';
            originalImage.addEventListener('click', function() {
                window.location.href = '/';
            });

            mapContainer.classList.add('hidden');
        };
    }

    function leafletOnLoadImage(data, map, img) {
        originalImage.classList.add('hidden');
        const imageWidth = img.width;
        const imageHeight = img.height;

        // Define bounds for the image
        const bounds = [[0, 0], [imageHeight, imageWidth]];

        // Add the image overlay (using placeholder since actual image path is not available)
        // In a real scenario, replace '/api/placeholder/800/600' with 'public/page.png'
        const image = L.imageOverlay('../' + data.input_image, bounds).addTo(map);

        // Set the view to fit the image bounds
        map.fitBounds(bounds);
        
        // Store polygons in an object for easy access
        // define polygons to be accessible in the whole scope
        window.polygons = {};
        // let polygons = {};
        
        // Define polygon coordinates (adjust as needed for your image)
        // const debug_polygon = [
        //     [50, 100],
        //     [100, 150],
        //     [150, 100],
        //     [100, 50]
        // ];
        
        // Create polygon
        // const polygon = L.polygon(debug_polygon, {
        //     color: 'green',
        //     fillOpacity: 0.5
        // }).addTo(map);

        getTableRegions(data.xml_content, img)
            .forEach((table) => addTable(table, data.html_tables[table.id]));

        getNonTableTextLines(data.xml_content, img)
            .forEach((textLine) => addTextline(textLine));
        
        // Store the polygon with an ID for later reference
        // window.polygons.debug_polygon = polygon;
        
        // // Bind click event to polygon
        // polygon.on('click', function() {
        //     scrollToSection('section1');
        // });
        
        // // Add popup to show what will happen on click
        // polygon.bindTooltip("Click to view details");
    }
    // Clean up interval when leaving the page
    window.addEventListener('beforeunload', () => {
        if (pollingInterval) {
            clearInterval(pollingInterval);
        }
    });
});

function addTable(xml_table, html_table) {
    // Create polygon for each table region
    add_polygon(xml_table, 'blue', scrollToTable);

    // add <p> with xml_table.table_content to table-results div under what is already there
    // tableResults.classList.remove('hidden');
    const tableResults = document.getElementById('table-results');

    if (html_table) {
        // instead of p, add the html table
        const div = document.createElement('div');

        div.innerHTML = html_table;
        div.id = xml_table.id;
        div.classList.add('table-result');
        // add line break
        const br = document.createElement('br');
        div.appendChild(br);
        // add button to focus on polygon
        div.addEventListener('click', function() {
            focusOnPolygon(xml_table.id);
        });
        tableResults.appendChild(div);

        const downloadButton = document.createElement('a');
        downloadButton.href = `data:text/html;charset=utf-8,${encodeURIComponent(html_table)}`;
        downloadButton.download = `${xml_table.id}.html`;
        downloadButton.textContent = 'Download HTML';
        downloadButton.classList.add('download-button');
        downloadButton.style.display = 'block';
        downloadButton.style.color = '#3498db';
        downloadButton.style.textDecoration = 'underline';
        downloadButton.style.cursor = 'pointer';
        downloadButton.addEventListener('click', function(event) {
            event.stopPropagation(); // Prevent the click from triggering the polygon focus
        });
        div.appendChild(downloadButton);
        // add line break
        const br2 = document.createElement('br');
        div.appendChild(br2);


    } else {
        console.error('HTML table not found defaulting to xml_table.table_content');
        const p = document.createElement('p');
        p.textContent = xml_table.table_content;
        p.id = xml_table.id;
        p.classList.add('table-result');
        // add line break
        const br = document.createElement('br');
        p.appendChild(br);
        // add button to focus on polygon
        p.addEventListener('click', function() {
            focusOnPolygon(xml_table.id);
        });
        tableResults.appendChild(p);
    }
}

function addTextline(xml_textline) {
    // Create polygon for each text line
    add_polygon(xml_textline, 'yellow', scrollToTranscription);

    // add <p> with xml_textline.transcription to textline-transcriptions div under what is already there
    // check if textline-transcriptions div exists
    if (!document.getElementById('textline-transcriptions')) {
        console.error('textline-transcriptions div not found');
        return;
    }

    const textlineTranscriptions = document.getElementById('textline-transcriptions');
    const p = document.createElement('p');
    p.textContent = xml_textline.transcription;
    p.id = xml_textline.id;
    p.classList.add('textline-transcription');
    
    // add line break
    const br = document.createElement('br');
    p.appendChild(br);
    // add button to focus on polygon

    p.addEventListener('click', function() {
        focusOnPolygon(xml_textline.id);
    });
    textlineTranscriptions.appendChild(p);
}

function add_polygon(xml_polygon, color, scrollTo) {
    // Create polygon for each text line
    const leaflet_polygon = L.polygon(xml_polygon.coords, {
        color: color,
        fillOpacity: 0.1
    }).addTo(window.map);
    
    // Store the polygon with its ID
    window.polygons[xml_polygon.id] = leaflet_polygon;

    // add on click focus section with id xml_polygon.id
    leaflet_polygon.on('click', function() {
        scrollTo(xml_polygon.id);
    });
}

function scrollToTranscription(sectionId) {
    const container = document.getElementById('textline-transcriptions');
    scrollToSection(sectionId, container);
}

function scrollToTable(sectionId) {
    const container = document.getElementById('table-results');
    scrollToSection(sectionId, container);
}

// Function to scroll to section and highlight it
function scrollToSection(sectionId, container) {
    // const container = document.getElementById('textline-transcriptions');
    const transcriptionElement = document.getElementById(sectionId);
    
    if (!transcriptionElement) {
        console.error(`Section with ID ${sectionId} not found.`);
        return;
    }
    
    // scroll to the section so the section is at the bottom of the screen
    container.scrollIntoView({ behavior: 'smooth', block: 'end' });

    // Calculate where to scroll to - this gets the position of the target relative to its parent
    const scrollPosition = transcriptionElement.offsetTop - container.offsetTop;

    // Smooth scroll to that position within the container
    container.scrollTo({
        top: scrollPosition,
        behavior: 'smooth'
    });


    // // section.scrollIntoView({ behavior: 'smooth' });
    // // Scroll to the section but the section should end up in the bottom of the screen
    // const sectionRect = section.getBoundingClientRect();
    // const offsetBottom = sectionRect.bottom - window.innerHeight;
    // const sectionBottom = sectionRect.bottom + window.scrollY - offsetBottom;
    // window.scrollTo({ top: sectionBottom, behavior: 'smooth' });


    // const offset = sectionRect.height - window.innerHeight;
    // const sectionTop = sectionRect.top + window.scrollY - offset;
    // window.scrollTo({ top: sectionTop, behavior: 'smooth' });
    
    // Add highlight effect
    transcriptionElement.classList.add('highlight');
    
    // Remove highlight after 3 seconds
    setTimeout(() => {
        transcriptionElement.classList.remove('highlight');
    }, 3000);
}

// Function to focus on a polygon
function focusOnPolygon(polygonId) {
    const polygon = window.polygons[polygonId];
    console.log('Focusing on polygon:', polygon);

    if (!polygon) {
        console.error(`Polygon with ID ${polygonId} not found.`);
        return;
    }

    // Ensure the polygon exists
    if (polygon) {
        // Scroll to the map section
        const mapSection = document.getElementById('map');
        mapSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // scroll to the top of the page with smooth behavior
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Center map on polygon
        window.map.fitBounds(polygon.getBounds());

        // Highlight the polygon
        const originalStyle = {
            fillOpacity: polygon.options.fillOpacity,
            fillColor: polygon.options.fillColor
        };

        // Increase opacity for highlight effect
        polygon.setStyle({
            fillOpacity: 0.7,
            // fillColor: '#5dff7f'
        });

        // Reset style after animation
        setTimeout(() => {
            polygon.setStyle(originalStyle);
        }, 2000);
    }
}
