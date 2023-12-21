import { faker } from '@faker-js/faker';
import { DateTime } from 'luxon';
import { v4 as uuid } from 'uuid';

const validCoordinates = [
  { lat: 42.3314, long: -83.0458 },
  { lat: 48.858262, long: 2.294513 },
  { lat: 54.6872, long: 25.2797 },
  { lat: 59.437, long: 24.7536 },
  { lat: 56.9677, long: 24.1056 },
  { lat: 52.52, long: 13.405 },
  { lat: 35.6764, long: 139.65 },
  { lat: 51.5072, long: 0.1276 },
];

export function generateTweetStreamItem() {
  const coordinates = validCoordinates[faker.number.int({ min: 0, max: 20 })];

  return {
    data: {
      id: uuid(),
      message: faker.word.words({ count: { min: 5, max: 10 } }),
      created_at: DateTime.now().toUTC().toISO(),
      ...(coordinates
        ? {
            geo: {
              coordinates: {
                coordinates: [coordinates.lat, coordinates.long],
              },
              type: 'Point',
            },
          }
        : {}),
    },
  };
}
