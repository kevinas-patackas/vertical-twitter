interface Config {
  PROCESSED_TWEETS_TABLE?: string;
  GEO_API_URL?: string;
  GEO_API_TOKEN_SECRET_NAME?: string;
  GEO_API_TOKEN?: string;
}

export default {
  ...process.env,
} as Config;
