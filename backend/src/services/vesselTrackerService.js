// upon filing a report of a vessel, the third party vessel tracker API is called to get the current location of the vessel and store it in the database. This service is responsible for calling the third party API and storing the location data in the database.

const axios = require("axios");
const Report = require("../models/Report");

const haversineDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const R = 6371; // km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const VESSEL_TRACKER_API_URL = "https://api.vesseltracker.com/v1/vessels";
const VESSEL_TRACKER_API_KEY = process.env.VESSEL_TRACKER_API_KEY;
const VESSEL_FINDER_API_URL = "https://api.vesselfinder.com/vessels";
const VESSEL_FINDER_API_KEY = process.env.VESSEL_FINDER_API_KEY;

// MyShipTracking API Configuration
const MYSHIPTRACKING_API_KEY = process.env.MYSHIPTRACKING_API_KEY;
const MYSHIPTRACKING_BASE_URL = process.env.MYSHIPTRACKING_BASE_URL || "https://api.myshiptracking.com";

console.log('Environment variables loaded:');
console.log('MYSHIPTRACKING_API_KEY exists:', !!MYSHIPTRACKING_API_KEY);
console.log('MYSHIPTRACKING_BASE_URL:', MYSHIPTRACKING_BASE_URL);

/**
 * Track a specific vessel by name and store its location
 * @param {string} reportId - The report ID to update
 * @param {string} vesselName - Name of the vessel to track
 * @returns {Object} Vessel data from API
 */
exports.trackVessel = async (reportId, vesselName) => {
    try {
        const response = await axios.get(`${VESSEL_TRACKER_API_URL}?name=${encodeURIComponent(vesselName)}`, {
            headers: {
                "Authorization": `Bearer ${VESSEL_TRACKER_API_KEY}`
            }
        });
        const vesselData = response.data;

        // Update the report with the vessel's current location
        await Report.findByIdAndUpdate(reportId, {
            $set: {
                vesselLocation: vesselData.location
            }
        });

        return vesselData;
    } catch (error) {
        console.error("Error tracking vessel:", error);
        throw new Error("Failed to track vessel");
    }
};

/**
 * Fetch vessels within a geographic zone
 * @param {number} minlat - Minimum latitude
 * @param {number} maxlat - Maximum latitude
 * @param {number} minlon - Minimum longitude
 * @param {number} maxlon - Maximum longitude
 * @param {number} minutesBack - Maximum age of position in minutes (default: 60)
 * @returns {Array} Array of vessels in the zone
 */
exports.getVesselsInZone = async (minlat, maxlat, minlon, maxlon, minutesBack = 60) => {
    try {
        console.log('getVesselsInZone called with:', { minlat, maxlat, minlon, maxlon, minutesBack });

        if (minlat === undefined || maxlat === undefined || minlon === undefined || maxlon === undefined) {
            throw new Error("All bounding box coordinates (minlat, maxlat, minlon, maxlon) are required");
        }

        const standardize = (vesselList) => {
            return vesselList
                .map(vessel => ({
                    MMSI: vessel.mmsi || vessel.MMSI || vessel.mmsi_number || 'Unknown',
                    NAME: vessel.name || vessel.NAME || vessel.ship_name || vessel.vessel_name || 'Unknown Vessel',
                    LAT: parseFloat(vessel.lat || vessel.latitude || vessel.LAT || 0),
                    LON: parseFloat(vessel.lon || vessel.longitude || vessel.LON || vessel.lng || 0),
                    TYPE: vessel.type || vessel.TYPE || vessel.ship_type || vessel.vessel_type || 'Unknown',
                    SPEED: parseFloat(vessel.speed || vessel.SPEED || 0),
                    COURSE: parseFloat(vessel.course || vessel.COURSE || vessel.heading || 0),
                    STATUS: vessel.status || vessel.STATUS || vessel.nav_status || 'Unknown',
                    DISTANCE_KM: null // Not applicable for zone queries
                }))
                .filter(v => !isNaN(v.LAT) && !isNaN(v.LON) && v.LAT !== 0 && v.LON !== 0);
        };

        const fallbackVessels = [
            { MMSI: "111111111", NAME: "MV BlueSky", LAT: (minlat + maxlat) / 2 + 0.01, LON: (minlon + maxlon) / 2 + 0.01, TYPE: "Cargo", SPEED: 12, COURSE: 120, STATUS: "MOVING", DISTANCE_KM: null },
            { MMSI: "222222222", NAME: "MV OceanStar", LAT: (minlat + maxlat) / 2 - 0.015, LON: (minlon + maxlon) / 2 - 0.02, TYPE: "Tanker", SPEED: 8, COURSE: 45, STATUS: "MOVING", DISTANCE_KM: null },
        ];

        if (MYSHIPTRACKING_API_KEY) {
            try {
                console.log('✓ MyShipTracking API key exists, attempting zone query...');
                console.log('Using MyShipTracking API v2 vessel zone');

                const apiUrl = `${MYSHIPTRACKING_BASE_URL}/api/v2/vessel/zone`;
                const params = {
                    minlat,
                    maxlat,
                    minlon,
                    maxlon,
                    minutesBack,
                    response: 'simple'
                };

                console.log('📍 API URL:', apiUrl);
                console.log('📍 Params:', params);
                console.log('📍 Auth Header: Bearer ' + MYSHIPTRACKING_API_KEY.substring(0, 10) + '...');

                const response = await axios.get(apiUrl, {
                    params,
                    headers: {
                        'Authorization': `Bearer ${MYSHIPTRACKING_API_KEY}`,
                        'Accept': 'application/json'
                    },
                    timeout: 10000
                });

                console.log('✓ MyShipTracking API v2 zone status:', response.status);
                console.log('✓ Response structure:', {
                    hasData: !!response.data,
                    dataKeys: response.data ? Object.keys(response.data) : [],
                    dataType: typeof response.data
                });

                // MyShipTracking v2 returns: { status: "success", duration: "...", timestamp: "...", data: [...] }
                let vessels = [];
                if (response.data && response.data.data && Array.isArray(response.data.data)) {
                    vessels = response.data.data;
                    console.log('✓ Extracted vessels from response.data.data');
                } else if (Array.isArray(response.data)) {
                    vessels = response.data;
                    console.log('✓ Response is array, using directly');
                } else {
                    console.warn('⚠ Unexpected response structure:', JSON.stringify(response.data).substring(0, 200));
                }

                console.log(`✓ Parsed ${vessels.length} vessels from MyShipTracking v2 zone`);

                const standardized = standardize(vessels);
                if (standardized.length > 0) {
                    console.log(`✓✓✓ MyShipTracking v2 zone returned ${standardized.length} LIVE vessels`);
                    return standardized;
                }

                console.log('⚠ MyShipTracking v2 zone returned no usable vessels after standardize, using fallback');
            } catch (myshipError) {
                console.error('✗✗✗ MyShipTracking v2 zone API error:');
                console.error('  Message:', myshipError.message);
                console.error('  Status:', myshipError.response?.status);
                console.error('  Status Text:', myshipError.response?.statusText);
                console.error('  Error code:', myshipError.response?.data?.code);
                console.error('  Error message:', myshipError.response?.data?.message);
                console.error('  Full response:', JSON.stringify(myshipError.response?.data).substring(0, 500));
            }
        } else {
            console.warn('⚠ MYSHIPTRACKING_API_KEY not set, using fallback');
        }

        console.warn('No external API produced vessels, using fallback mock vessels');
        return fallbackVessels;
    } catch (error) {
        console.error("getVesselsInZone general failure:", error);
        return [
            { MMSI: "111111111", NAME: "MV BlueSky", LAT: (minlat + maxlat) / 2 + 0.01, LON: (minlon + maxlon) / 2 + 0.01, TYPE: "Cargo", SPEED: 12, COURSE: 120, STATUS: "MOVING", DISTANCE_KM: null },
            { MMSI: "222222222", NAME: "MV OceanStar", LAT: (minlat + maxlat) / 2 - 0.015, LON: (minlon + maxlon) / 2 - 0.02, TYPE: "Tanker", SPEED: 8, COURSE: 45, STATUS: "MOVING", DISTANCE_KM: null },
        ];
    }
};