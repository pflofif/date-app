let gapiLoaded = false;
let gisLoaded = false;
let tokenClient;
let accessToken = null;

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/calendar.events';

/**
 * Load the Google API and GIS libraries
 */
export const initializeGoogleCalendar = () => {
  return new Promise((resolve, reject) => {
    // Load GAPI
    const gapiScript = document.createElement('script');
    gapiScript.src = 'https://apis.google.com/js/api.js';
    gapiScript.async = true;
    gapiScript.defer = true;
    gapiScript.onload = () => {
      gapi.load('client', async () => {
        await gapi.client.init({
          apiKey: API_KEY,
          discoveryDocs: [DISCOVERY_DOC],
        });
        gapiLoaded = true;
        if (gisLoaded) resolve();
      });
    };
    gapiScript.onerror = reject;
    document.body.appendChild(gapiScript);

    // Load GIS
    const gisScript = document.createElement('script');
    gisScript.src = 'https://accounts.google.com/gsi/client';
    gisScript.async = true;
    gisScript.defer = true;
    gisScript.onload = () => {
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: '', // Will be set dynamically
      });
      gisLoaded = true;
      if (gapiLoaded) resolve();
    };
    gisScript.onerror = reject;
    document.body.appendChild(gisScript);
  });
};

/**
 * Request Google OAuth token
 */
const requestAccessToken = () => {
  return new Promise((resolve, reject) => {
    tokenClient.callback = (response) => {
      if (response.error) {
        reject(response);
        return;
      }
      accessToken = response.access_token;
      resolve(response);
    };

    if (accessToken === null) {
      // Prompt the user to select a Google Account and consent
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      // Skip display of account chooser and consent dialog
      tokenClient.requestAccessToken({ prompt: '' });
    }
  });
};

/**
 * Add an event to Google Calendar
 * @param {Object} dateIdea - The date idea object
 * @param {string} scheduledDateTime - ISO datetime string
 * @returns {Promise<Object>} - The created calendar event
 */
export const addToGoogleCalendar = async (dateIdea, scheduledDateTime) => {
  if (!CLIENT_ID || !API_KEY) {
    throw new Error('Google Calendar API credentials not configured. Please set VITE_GOOGLE_CLIENT_ID and VITE_GOOGLE_API_KEY in .env');
  }

  if (!gapiLoaded || !gisLoaded) {
    await initializeGoogleCalendar();
  }

  // Request access token if not available
  if (!accessToken) {
    await requestAccessToken();
  }

  const startDateTime = new Date(scheduledDateTime);
  const endDateTime = new Date(startDateTime.getTime() + 2 * 60 * 60 * 1000); // Default 2 hours duration

  const event = {
    summary: `Date Night: ${dateIdea.title}`,
    description: dateIdea.description || '',
    start: {
      dateTime: startDateTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: endDateTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 60 },
        { method: 'popup', minutes: 1440 }, // 1 day before
      ],
    },
  };

  try {
    const response = await gapi.client.calendar.events.insert({
      calendarId: 'primary',
      resource: event,
    });

    return response.result;
  } catch (error) {
    // If token expired, retry once
    if (error.status === 401) {
      accessToken = null;
      await requestAccessToken();
      const response = await gapi.client.calendar.events.insert({
        calendarId: 'primary',
        resource: event,
      });
      return response.result;
    }
    throw error;
  }
};

/**
 * Sign out from Google
 */
export const signOutGoogle = () => {
  if (accessToken) {
    google.accounts.oauth2.revoke(accessToken);
    accessToken = null;
  }
};

/**
 * Check if user is authenticated
 */
export const isGoogleAuthenticated = () => {
  return accessToken !== null;
};