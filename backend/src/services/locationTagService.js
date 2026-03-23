//implement the location taggin service API here

import axios from "axios";



MAPBOX_API_KEY = process.env.MAPBOX_API_KEY;

export const getLocationFromCoordinates = async (latitude, longitude) => {
  try {
    const response = await axios.get(`https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json`, {
      params: {
        access_token: MAPBOX_API_KEY
      }
    });
    return response.data.features[0].place_name;
  } catch (error) {
    console.error("Error fetching location from coordinates:", error);
    throw error;
  }
};

export const getCoordinatesFromLocation = async (location) => {
  try {
    const response = await axios.get(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(location)}.json`, {
        params: {
            access_token: MAPBOX_API_KEY
        }
    });
    return response.data.features[0].geometry.coordinates;
  } catch (error) {
    console.error("Error fetching coordinates from location:", error);
    throw error;
  }
};          

