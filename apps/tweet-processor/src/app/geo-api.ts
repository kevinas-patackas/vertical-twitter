import { TwitterStreamItem } from '@vertical-twitter/types';
import axios from 'axios';
import { logger } from './logger';
import config from './config';

export async function getTweetCountryName(tweet: TwitterStreamItem) {
  const coordinates = tweet.data.geo?.coordinates?.coordinates;
  if (!coordinates) {
    return 'unknown';
  }

  const [lat, long] = coordinates;
  logger.info('Getting country from GEO API');
  const geoApiResponse = await axios.get(
    `${config.GEO_API_URL}/geo-api/country`,
    {
      params: { lat, long },
      headers: {
        Authorization: `Bearer ${config.GEO_API_TOKEN}`,
      },
    }
  );
  logger.info('Successfully received data from GEO API', {
    event: geoApiResponse.data,
  });
  return geoApiResponse.data.name;
}
