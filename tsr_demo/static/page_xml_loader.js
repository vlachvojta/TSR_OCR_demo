// This file is for parsing XML content and all XML related functions


// @description This function counts the number of tables in the XML content.
// @param {string} xml_content - The XML content as a string
// @returns {number} - The number of tables in the XML content
function countTables(xml_content) {
    // Parse the XML content
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xml_content, 'text/xml');

    // Get all table elements
    const tables = xmlDoc.getElementsByTagName('TableRegion');

    // Return the number of tables
    return tables.length;
}


// @description This function retrieves the table regions with polygon coordinates from the XML content.
// @param {string} xml_content - The XML content as a string
// @param {HTMLImageElement} img - The image element to get the dimensions from
// @returns {Array} - An array of objects containing the table region id and coordinates
function getTableRegions(xml_content, img) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xml_content, 'text/xml');

    const tables = xmlDoc.getElementsByTagName('TableRegion');
    const tableRegions = [];

    for (let i = 0; i < tables.length; i++) {
        const table = tables[i];
        const coords = table.getElementsByTagName('Coords')[0].getAttribute('points');
        const regionAttributes = {
            id: table.getAttribute('id'),
            coords: loadCoords(coords, img),
            table_content: new XMLSerializer().serializeToString(table),
        };
        tableRegions.push(regionAttributes);
    }

    return tableRegions;
}

// @description This function retrieves the non-table text lines with polygon coordinates from the XML content.
// @param {string} xml_content - The XML content as a string
// @param {HTMLImageElement} img - The image element to get the dimensions from
// @returns {Array} - An array of objects containing the text line id, coordinates and transcription
function getNonTableTextLines(xml_content, img) {
    // Parse the XML content
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xml_content, 'text/xml');
    var nonTableTextLines = [];

    const textRegions = xmlDoc.getElementsByTagName('TextRegion');

    for (let i = 0; i < textRegions.length; i++) {
        const textlines = textRegions[i].getElementsByTagName('TextLine');
        for (let j = 0; j < textlines.length; j++) {
            const coords = textlines[j].getElementsByTagName('Coords')[0].getAttribute('points');

            const lineAttributes = {
                id: textlines[j].getAttribute('id'),
                coords: loadCoords(coords, img),
                transcription: getTextLineTranscription(textlines[j])
            };
            nonTableTextLines.push(lineAttributes);
        }
    }

    return nonTableTextLines;
}

// @description This function retrieves the table cells with polygon coordinates from the XML content.
// @param {string} xml_content - The XML content as a string
// @param {HTMLImageElement} img - The image element to get the dimensions from
// @returns {Array} - An array of objects containing the table cell id, coordinates, and text
function loadCoords(coordsString, img) {
    const coordsArray = coordsString.split(' ');

    const coords = coordsArray.map(coord => {
        const [x, y] = coord.split(',').map(Number);
        return [y, x];
    });

    // Leaflet uses [lat, lng], so the y-coordinate need to be flipped
    const flippedCoords = coords.map(coord => [img.height - coord[0], coord[1]]);
    return flippedCoords;
}

// @description Get only the transcription from the TextLine element, not from nested word elements
function getTextLineTranscription(textline) {
    // Get the TextEquiv elements that are direct children of the TextLine element
    // For TextLine's direct TextEquiv child
    var transcription = null;
    for (let i = 0; i < textline.children.length; i++) {
        if (textline.children[i].tagName === 'TextEquiv') {
            transcription = textline.children[i].getElementsByTagName('Unicode')[0].textContent;
            break;
        }
    }

    return transcription;
}
