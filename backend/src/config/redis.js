import IORedis from 'ioredis'

// Central BullMQ Redis connection. REDIS_URL keeps deployments flexible while
// the localhost fallback matches the local development Redis instance.
export const redisConnection = process.env.REDIS_URL
  ? new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null })
  : new IORedis({
      host: '127.0.0.1',
      port: 6379,
      maxRetriesPerRequest: null
    })

redisConnection.on('error', (error) => {
  console.error('Redis connection error:', error)
})
