// Mock Mapbox GL for iOS - prevents import errors
module.exports = {
  setAccessToken: () => {},
  MapView: null,
  Camera: null,
  PointAnnotation: null,
  StyleURL: {
    Satellite: 'mapbox://styles/mapbox/satellite-v9'
  }
};