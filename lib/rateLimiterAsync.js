import Promise from 'bluebird'
import { RateLimiter } from 'limiter'

export const createLimiterAsync = (tokensPerInterval, interval, fireImmediately) => {
  return Promise.promisifyAll(new RateLimiter(tokensPerInterval, interval, fireImmediately))
}
