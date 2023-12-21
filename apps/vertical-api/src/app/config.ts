interface Config {
  SQS_QUEUE_URL?: string;
  TWITTER_API_URL?: string;
  PROCESSED_TWEETS_TABLE?: string;
  TWITTER_TOKEN_SECRET_NAME?: string;
  VERTICAL_API_TOKEN_SECRET_NAME?: string;
  TWITTER_TOKEN?: string;
  VERTICAL_API_TOKEN?: string;
}

export default {
  ...process.env,
} as Config;
