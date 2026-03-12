import dotenv from 'dotenv';
import { runAutoBuildingDetection } from '../services/autoBuildingDetectionService.js';

dotenv.config();

const cityCode = process.argv[2];
const limit = Number(process.argv[3] || 25);
const radiusMeters = Number(process.argv[4] || 1500);

if (!cityCode) {
  console.error('Usage: node backend/src/scripts/seedAutoDetectedBuildings.js <CITY_CODE> [LIMIT] [RADIUS_METERS]');
  process.exit(1);
}

runAutoBuildingDetection({
  cityCode,
  limit,
  radiusMeters,
  createdBy: 'CLI Detection Engine',
}).then((result) => {
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}).catch((error) => {
  console.error('Failed to seed auto-detected buildings', error);
  process.exit(1);
});
