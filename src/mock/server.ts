import { computeCart } from './store'
import { handle as userHandler } from './user'
import { handle as orderHandler } from './order'
import { handle as cartHandler } from './cart'
import { handle as checkoutHandler } from './checkout'
import { handle as subscriptionHandler } from './subscription'
import { handle as planHandler } from './plan'
import { handle as goodsHandler } from './goods'
import { handle as otherHandler } from './other'

/**
 * Main mock request entry point.
 * Delegates requests to domain-specific modules.
 */
export const mockRequest = async (options: UniApp.RequestOptions) => {
  let url = String(options.url || '')

  // Extract pathname and query for matching
  try {
    // Basic extraction for environments without full URL support or for relative paths
    if (url.includes('://')) {
      const parts = url.split('://')[1].split('/')
      parts.shift() // remove host
      url = '/' + parts.join('/')
    } else if (!url.startsWith('/')) {
      url = '/' + url
    }
  } catch (e) {
    console.error('Mock URL parse error:', e)
  }

  const handlers = [
    userHandler,
    orderHandler,
    cartHandler,
    checkoutHandler,
    subscriptionHandler,
    planHandler,
    goodsHandler,
    otherHandler,
  ]

  for (const handler of handlers) {
    const res = await handler(url, options)
    if (res !== null) return res
  }

  console.warn(`[Mock] No handler found for ${options.method} ${url}`)
  return null
}
