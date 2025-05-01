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
