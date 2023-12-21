import axios from 'axios';
import { Readable } from 'stream';
import { logger } from './utils/logger';
import { delay } from './utils/helpers';
import EventEmitter from 'events';
import config from './config';

export class TweetStream {
  private connecting = false;
  private reconnectInMs = 5000;
  private bearerToken: string;
  private stream?: Readable;
  private eventEmitter = new EventEmitter();

  static instance?: TweetStream;
  static getInstance() {
    return TweetStream.instance;
  }

  get events() {
    return this.eventEmitter;
  }

  get status() {
    return {
      connecting: this.connecting,
      connected: !!this.stream,
    };
  }

  constructor(bearerToken: string) {
    TweetStream.instance = this;
    this.bearerToken = bearerToken;
  }

  async start() {
    if (this.connecting) {
      logger.info(`Already connecting to Tweet Stream`);
      return;
    }

    if (this.stream) {
      logger.info(`Already listening to Tweet Stream`);
      return;
    }

    try {
      this.connecting = true;
      logger.info(`Connecting to Tweet Stream`);
      const connection = await this.getStreamConnection();
      this.stream = connection.data;
      logger.info(`Successfully connected to Tweet Stream`);
    } catch (error) {
      logger.info(`Failed to establish connection with Tweet Stream`);
      this.stream = null;
      this.handleReconnect();
      return;
    } finally {
      this.connecting = false;
    }

    this.stream.on('data', (data) => {
      const jsonString: string = data.toString();
      this.eventEmitter.emit('data', jsonString);
    });

    this.stream.on('end', () => {
      logger.info('Tweet Stream connection end');
      this.stream = null;
      this.handleReconnect();
    });

    this.stream.on('error', () => {
      logger.info('Tweet Stream connection error');
      this.stream = null;
      this.handleReconnect();
    });
  }

  stop() {
    logger.info(`Stoping Tweet Stream`);
    if (this.stream) {
      this.stream.destroy();
      this.stream = null;
    }
    logger.info(`Stopped Tweet Stream`);
  }

  async setStreamKeywords(keywords: string) {
    const queryParams = new URLSearchParams({ delete_all: 'true' });
    await axios.post(
      `${
        config.TWITTER_API_URL
      }/2/tweets/search/stream/rules?${queryParams.toString()}`,
      JSON.stringify({
        add: [{ value: keywords }],
      }),
      {
        headers: {
          Authorization: `Bearer ${this.bearerToken}`,
        },
      }
    );
  }

  private getStreamConnection() {
    const queryParams = new URLSearchParams({
      expansions: 'geo.place_id',
      'tweet.fields': 'created_at',
    });
    return axios.get<Readable>(
      `${
        config.TWITTER_API_URL
      }/2/tweets/search/stream?${queryParams.toString()}`,
      {
        responseType: 'stream',
        headers: {
          Authorization: `Bearer ${this.bearerToken}`,
        },
      }
    );
  }

  private async handleReconnect() {
    logger.info(
      `Will try reconnecting to Tweet Stream in: ${this.reconnectInMs}ms`
    );
    await delay(this.reconnectInMs);
    this.start();
  }
}
