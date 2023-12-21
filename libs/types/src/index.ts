export interface TwitterStreamItem {
  data: {
    id: string;
    message: string;
    created_at: string;
    geo?: {
      coordinates?: {
        coordinates: [number, number];
        type: 'Point';
      };
    };
  };
}
