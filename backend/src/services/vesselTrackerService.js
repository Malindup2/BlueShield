const axios = require("axios");
const Report = require("../models/Report");
const vesselDatabase = require("../data/vesselDatabase.json");

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

// DataDocked (VesselFinder) API Configuration
const DATADOCKED_API_KEY = process.env.DATADOCKED_API_KEY;
const DATADOCKED_BASE_URL = "https://datadocked.com/api/vessels_operations";

// Legacy MyShipTracking API Configuration (fallback)
const MYSHIPTRACKING_API_KEY = process.env.MYSHIPTRACKING_API_KEY;
const MYSHIPTRACKING_BASE_URL = process.env.MYSHIPTRACKING_BASE_URL || "https://api.myshiptracking.com";

// Beeceptor Mock API Configuration (fallback before local data)
const BEECEPTOR_VESSEL_API_URL = process.env.BEECEPTOR_VESSEL_API_URL;

console.log('Vessel Tracker - API keys loaded:');
console.log('  DATADOCKED_API_KEY exists:', !!DATADOCKED_API_KEY);
console.log('  MYSHIPTRACKING_API_KEY exists:', !!MYSHIPTRACKING_API_KEY);
console.log('  BEECEPTOR_VESSEL_API_URL exists:', !!BEECEPTOR_VESSEL_API_URL);

/**
 * Standardize vessel data from different API sources into a consistent format
 */
const standardize = (vesselList, source = 'unknown') => {
    return vesselList
        .map(vessel => {
            // DataDocked returns speed in tenths of knots (e.g. "110" = 11.0 knots)
            let speed = parseFloat(vessel.speed || vessel.SPEED || 0);
            if (source === 'datadocked' && speed > 50) {
                speed = speed / 10;
            }

            return {
                MMSI: String(vessel.mmsi || vessel.MMSI || vessel.mmsi_number || 'Unknown'),
                NAME: vessel.name || vessel.NAME || vessel.ship_name || vessel.vessel_name || 'Unknown Vessel',
                LAT: parseFloat(vessel.latitude || vessel.lat || vessel.LAT || 0),
                LON: parseFloat(vessel.longitude || vessel.lon || vessel.LON || vessel.lng || 0),
                TYPE: vessel.type || vessel.TYPE || vessel.ship_type || vessel.vessel_type || 'Unknown',
                SPEED: speed,
                COURSE: parseFloat(vessel.course || vessel.COURSE || vessel.heading || 0),
                HEADING: parseFloat(vessel.heading || vessel.HEADING || 0),
                STATUS: vessel.status || vessel.STATUS || vessel.nav_status || 'Unknown',
                DISTANCE_KM: null
            };
        })
        .filter(v => !isNaN(v.LAT) && !isNaN(v.LON) && v.LAT !== 0 && v.LON !== 0);
};

/**
 * Track a specific vessel by name and store its location
 * @param {string} reportId - The report ID to update
 * @param {string} vesselName - Name of the vessel to track
 * @returns {Object} Vessel data from API
 */
exports.trackVessel = async (reportId, vesselName) => {
    try {
        // Use DataDocked search if available
        if (DATADOCKED_API_KEY) {
            const response = await axios.get(`${DATADOCKED_BASE_URL}/search-vessel`, {
                params: { name: vesselName },
                headers: {
                    'accept': 'application/json',
                    'x-api-key': DATADOCKED_API_KEY
                },
                timeout: 10000
            });

            const vesselData = response.data;
            if (vesselData && vesselData.latitude && vesselData.longitude) {
                await Report.findByIdAndUpdate(reportId, {
                    $set: {
                        vesselLocation: {
                            type: "Point",
                            coordinates: [parseFloat(vesselData.longitude), parseFloat(vesselData.latitude)]
                        }
                    }
                });
            }
            return vesselData;
        }

        throw new Error("No vessel tracking API configured");
    } catch (error) {
        console.error("Error tracking vessel:", error.message);
        throw new Error("Failed to track vessel");
    }
};

/**
 * Fetch vessels within a geographic zone using DataDocked API
 * Converts bounding box to center point + radius for the API
 *
 * @param {number} minlat - Minimum latitude
 * @param {number} maxlat - Maximum latitude
 * @param {number} minlon - Minimum longitude
 * @param {number} maxlon - Maximum longitude
 * @param {number} minutesBack - Not used by DataDocked but kept for interface compatibility
 * @returns {Array} Array of standardized vessel objects
 */
exports.getVesselsInZone = async (minlat, maxlat, minlon, maxlon, minutesBack = 60) => {
    try {
        if (minlat === undefined || maxlat === undefined || minlon === undefined || maxlon === undefined) {
            throw new Error("All bounding box coordinates (minlat, maxlat, minlon, maxlon) are required");
        }

        // Convert bounding box to center point + radius for DataDocked API
        const centerLat = (minlat + maxlat) / 2;
        const centerLon = (minlon + maxlon) / 2;
        // Calculate radius from center to corner of bounding box, capped at 50km (API max)
        const radius = Math.min(
            haversineDistance(centerLat, centerLon, maxlat, maxlon),
            50
        );

        // Build local fallback from vessel database — scatter vessels across the zone
        const buildLocalFallback = () => {
            const centerLat = (minlat + maxlat) / 2;
            const centerLon = (minlon + maxlon) / 2;
            const latSpread = (maxlat - minlat) * 0.3;
            const lonSpread = (maxlon - minlon) * 0.3;

            return vesselDatabase.map((v, i) => {
                const angle = (2 * Math.PI * i) / vesselDatabase.length;
                return {
                    MMSI: v.mmsi,
                    NAME: v.name,
                    LAT: centerLat + latSpread * Math.sin(angle),
                    LON: centerLon + lonSpread * Math.cos(angle),
                    TYPE: v.type,
                    SPEED: v.speed,
                    COURSE: v.course,
                    STATUS: v.status,
                    DISTANCE_KM: null
                };
            });
        };

        // --- Primary: DataDocked (VesselFinder) API ---
        if (DATADOCKED_API_KEY) {
            try {
                console.log('Attempting DataDocked API with:', {
                    latitude: centerLat.toFixed(1),
                    longitude: centerLon.toFixed(1),
                    circle_radius: Math.ceil(radius)
                });

                const response = await axios.get(`${DATADOCKED_BASE_URL}/get-vessels-by-area`, {
                    params: {
                        latitude: parseFloat(centerLat.toFixed(1)),
                        longitude: parseFloat(centerLon.toFixed(1)),
                        circle_radius: Math.max(1, Math.ceil(radius))
                    },
                    headers: {
                        'accept': 'application/json',
                        'x-api-key': DATADOCKED_API_KEY
                    },
                    timeout: 15000
                });

                console.log('DataDocked API response status:', response.status);

                let vessels = [];
                if (Array.isArray(response.data)) {
                    vessels = response.data;
                } else if (response.data && Array.isArray(response.data.data)) {
                    vessels = response.data.data;
                }

                console.log(`DataDocked returned ${vessels.length} raw vessels`);

                const standardized = standardize(vessels, 'datadocked');
                if (standardized.length > 0) {
                    console.log(`DataDocked: ${standardized.length} live vessels returned`);
                    return standardized;
                }

                console.log('DataDocked returned no usable vessels, trying fallback...');
            } catch (ddError) {
                if (ddError.response?.status === 429) {
                    console.error('⚠️  DataDocked RATE LIMIT EXCEEDED — max 50 requests/minute. Falling back to alternative API.');
                } else {
                    console.error('DataDocked API error:', ddError.message);
                    if (ddError.response) {
                        console.error('  Status:', ddError.response.status);
                        console.error('  Data:', JSON.stringify(ddError.response.data).substring(0, 300));
                    }
                }
            }
        }

        // --- Fallback: MyShipTracking API ---
        if (MYSHIPTRACKING_API_KEY) {
            try {
                console.log('Falling back to MyShipTracking API...');

                const response = await axios.get(`${MYSHIPTRACKING_BASE_URL}/api/v2/vessel/zone`, {
                    params: { minlat, maxlat, minlon, maxlon, minutesBack, response: 'simple' },
                    headers: {
                        'Authorization': `Bearer ${MYSHIPTRACKING_API_KEY}`,
                        'Accept': 'application/json'
                    },
                    timeout: 10000
                });

                let vessels = [];
                if (response.data && response.data.data && Array.isArray(response.data.data)) {
                    vessels = response.data.data;
                } else if (Array.isArray(response.data)) {
                    vessels = response.data;
                }

                const standardized = standardize(vessels, 'myshiptracking');
                if (standardized.length > 0) {
                    console.log(`MyShipTracking fallback: ${standardized.length} live vessels`);
                    return standardized;
                }
            } catch (mstError) {
                console.error('MyShipTracking fallback error:', mstError.message);
            }
        }

        // --- Tertiary: Beeceptor Mock API ---
        if (BEECEPTOR_VESSEL_API_URL) {
            try {
                console.log('Falling back to Beeceptor mock API...');

                const response = await axios.get(BEECEPTOR_VESSEL_API_URL, {
                    timeout: 8000
                });

                let vessels = [];
                if (Array.isArray(response.data)) {
                    vessels = response.data;
                } else if (response.data && Array.isArray(response.data.data)) {
                    vessels = response.data.data;
                }

                const standardized = standardize(vessels, 'beeceptor');

                // Expand the bounding box for Beeceptor since vessels are spread globally
                // Original frontend delta is 0.15° (~16km) — expand to ~5° (~550km) to find mock vessels
                const expandBy = 5;
                const beeMinLat = minlat - expandBy;
                const beeMaxLat = maxlat + expandBy;
                const beeMinLon = minlon - expandBy;
                const beeMaxLon = maxlon + expandBy;

                const inZone = standardized.filter(v =>
                    v.LAT >= beeMinLat && v.LAT <= beeMaxLat &&
                    v.LON >= beeMinLon && v.LON <= beeMaxLon
                );
                if (inZone.length > 0) {
                    console.log(`Beeceptor fallback: ${inZone.length} vessels in expanded zone (from ${standardized.length} total)`);
                    return inZone;
                }
                console.log(`Beeceptor: ${standardized.length} vessels fetched but none in expanded bounding box`);
            } catch (beeError) {
                console.error('Beeceptor fallback error:', beeError.message);
            }
        }

        // --- Final fallback: local vessel database ---
        console.warn('No external API produced vessels, returning local vessel database');
        return buildLocalFallback();
    } catch (error) {
        console.error("getVesselsInZone general failure:", error.message);
        const centerLat = (minlat + maxlat) / 2;
        const centerLon = (minlon + maxlon) / 2;
        const latSpread = (maxlat - minlat) * 0.3;
        const lonSpread = (maxlon - minlon) * 0.3;

        return vesselDatabase.map((v, i) => {
            const angle = (2 * Math.PI * i) / vesselDatabase.length;
            return {
                MMSI: v.mmsi,
                NAME: v.name,
                LAT: centerLat + latSpread * Math.sin(angle),
                LON: centerLon + lonSpread * Math.cos(angle),
                TYPE: v.type,
                SPEED: v.speed,
                COURSE: v.course,
                STATUS: v.status,
                DISTANCE_KM: null
            };
        });
    }
};
