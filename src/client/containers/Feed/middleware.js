import { FEED_FETCH_USER_LOCATION_FINISHED } from './actionTypes';
import { MAP_UPDATE_CENTER, MAP_UPDATE_ZOOM } from '../../components/Map/actionTypes';
import distanceCoordinates from '../../utils/gps';
import { updateMapCenter, updateMapZoom } from '../../components/Map/actions';
import { fetchEventsByLocation, fetchEventsByLocationOverWebSocket } from './actions';

const updateLocationMiddleware = store => next => (action) => {
  const { dispatch } = store;
  if (action.type === FEED_FETCH_USER_LOCATION_FINISHED) {
    const lat = parseFloat(action.payload.lat);
    const lng = parseFloat(action.payload.lng);
    const oldLat = parseFloat(action.payload.oldLat);
    const oldLng = parseFloat(action.payload.oldLng);
    const zoom = 12;

    if (!action.payload.forced) {
      const distance = distanceCoordinates(lat, lng, oldLat, oldLng);
      if (distance > 500) {
        // Make sure that if the target location is somewhat near to the current
        // location, don't update location
        dispatch(updateMapCenter({
          lat,
          lng,
          zoom,
          fetch: false,
        }));
        dispatch(updateMapZoom({ lat, lng, zoom }));
      }
    } else {
      dispatch(updateMapCenter({
        lat,
        lng,
        zoom,
        fetch: false,
      }));
      dispatch(updateMapZoom({ lat, lng, zoom }));
    }

    const { isLoggedIn } = store.getState().auth;
    if (isLoggedIn) {
      dispatch(fetchEventsByLocationOverWebSocket({ lat, lng, zoom }));
    } else {
      dispatch(fetchEventsByLocation({ lat, lng, zoom }));
    }
  }
  next(action);
};

const fetchEventsOnMapUpdateMiddleware = store => next => (action) => {
  const { dispatch } = store;
  if (action.type === MAP_UPDATE_CENTER || action.type === MAP_UPDATE_ZOOM) {
    const lat = parseFloat(action.payload.lat);
    const lng = parseFloat(action.payload.lng);
    const { zoom } = action.payload;
    const { fetch } = action.payload;
    if (fetch !== false) {
      const { isLoggedIn } = store.getState().auth;
      if (isLoggedIn) {
        dispatch(fetchEventsByLocationOverWebSocket({ lat, lng, zoom }));
      } else {
        dispatch(fetchEventsByLocation({ lat, lng, zoom }));
      }
    }
  }
  next(action);
};

export {
  updateLocationMiddleware,
  fetchEventsOnMapUpdateMiddleware,
};
