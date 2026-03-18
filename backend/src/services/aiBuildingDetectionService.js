// aiBuildingDetectionService.js
const axios = require('axios');

async function detectBuildingsFromImage(imageBuffer) {
  // Send image to FastAPI microservice
  const formData = new FormData();
  formData.append('image', imageBuffer, 'satellite.jpg');
  const response = await axios.post('http://localhost:8001/detect-buildings', formData, {
    headers: formData.getHeaders(),
    maxContentLength: Infinity,
    maxBodyLength: Infinity
  });
  return response.data.buildings;
}

module.exports = { detectBuildingsFromImage };
