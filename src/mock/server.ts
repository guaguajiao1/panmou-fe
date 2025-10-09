// Simple local mock server for development
// Exports `mockRequest` which returns a Promise resolving to the same Data<T> shape used by http.ts

type Data<T> = {
  code: string
  msg: string
  result: T
}

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms))

// In-memory address store (module-level so it persists across mockRequest calls)
const addresses: Array<any> = []

export const mockRequest = async (options: UniApp.RequestOptions): Promise<Data<any> | null> => {
  // Normalize url: remove base if present
  let url = String(options.url || '')
  try {
    // if full url, get pathname
    const u = new URL(url, 'http://localhost')
    url = u.pathname + u.search
  } catch (e) {
    // keep original
  }

  // small delay to simulate network
  await delay(200)

  // debug: print incoming normalized url/method/data
  try {
    console.debug &&
      console.debug('[mock] incoming url=', url, 'method=', options.method, 'data=', options.data)
  } catch (e) {
    /* ignore logging errors */
  }

  // --- Address endpoints: in-memory CRUD ---
  // list
  if (url.includes('/address/list')) {
    console.debug && console.debug('[mock] matched /address/list')
    return { code: '0', msg: 'ok', result: addresses.slice() }
  }

  // detail: /address/detail?id=123
  if (url.includes('/address/detail')) {
    console.debug && console.debug('[mock] matched /address/detail')
    const u = new URL(url, 'http://localhost')
    const id = Number(u.searchParams.get('id'))
    const found = addresses.find((a) => a.id === id)
    if (found) return { code: '0', msg: 'ok', result: found }
    return { code: '1', msg: 'not found', result: null }
  }

  // create
  if (url.includes('/address/create')) {
    console.debug && console.debug('[mock] matched /address/create')
    const body = (options.data as any) || {}
    const nextId = Date.now()
    const item = {
      id: nextId,
      name: body.name || '新用户',
      phone: body.phone || '',
      province: body.province || (body.region && String(body.region).split(' ')[0]) || '',
      city: body.city || (body.region && String(body.region).split(' ')[1]) || '',
      district: body.district || (body.region && String(body.region).split(' ')[2]) || '',
      details: body.details || body.detail || body.address || '',
      isDefault: !!body.isDefault,
    }
    if (item.isDefault) {
      addresses.forEach((a) => (a.isDefault = false))
    }
    console.debug && console.debug('[mock] created address', item)
    addresses.push(item)
    return { code: '0', msg: 'created', result: item }
  }

  // update
  if (url.includes('/address/update') || url.includes('/address/save')) {
    console.debug && console.debug('[mock] matched /address/update or /address/save')
    const body = (options.data as any) || {}
    const id = body.id || Number(new URL(url, 'http://localhost').searchParams.get('id'))
    const idx = addresses.findIndex((a) => a.id === Number(id))
    if (idx === -1) {
      return { code: '1', msg: 'not found', result: null }
    }
    const updated = {
      ...addresses[idx],
      name: body.name ?? addresses[idx].name,
      phone: body.phone ?? addresses[idx].phone,
      province:
        body.province ??
        (body.region && String(body.region).split(' ')[0]) ??
        addresses[idx].province,
      city: body.city ?? (body.region && String(body.region).split(' ')[1]) ?? addresses[idx].city,
      district:
        body.district ??
        (body.region && String(body.region).split(' ')[2]) ??
        addresses[idx].district,
      details: body.details ?? body.detail ?? body.address ?? addresses[idx].details,
      isDefault: body.isDefault !== undefined ? !!body.isDefault : addresses[idx].isDefault,
    }
    if (updated.isDefault) addresses.forEach((a) => (a.isDefault = false))
    addresses[idx] = updated
    console.debug && console.debug('[mock] updated address', updated)
    return { code: '0', msg: 'updated', result: updated }
  }

  // delete: /address/delete?id=123
  if (url.includes('/address/delete')) {
    console.debug && console.debug('[mock] matched /address/delete')
    const u = new URL(url, 'http://localhost')
    const id = Number(u.searchParams.get('id'))
    const idx = addresses.findIndex((a) => a.id === id)
    if (idx === -1) {
      return { code: '1', msg: 'not found', result: null }
    }
    const removed = addresses.splice(idx, 1)[0]
    // if removed was default, try to set first as default
    if (removed.isDefault && addresses.length > 0) addresses[0].isDefault = true
    console.debug && console.debug('[mock] deleted address', removed)
    return { code: '0', msg: 'deleted', result: removed }
  }

  // set-default: /address/set-default?id=123
  if (url.includes('/address/set-default')) {
    console.debug && console.debug('[mock] matched /address/set-default')
    const u = new URL(url, 'http://localhost')
    const id = Number(u.searchParams.get('id'))
    const idx = addresses.findIndex((a) => a.id === id)
    if (idx === -1) return { code: '1', msg: 'not found', result: null }
    addresses.forEach((a) => (a.isDefault = false))
    addresses[idx].isDefault = true
    console.debug && console.debug('[mock] set default', addresses[idx])
    return { code: '0', msg: 'ok', result: addresses[idx] }
  }

  // Order create
  if (url.includes('/order/create')) {
    return {
      code: '0',
      msg: 'ok',
      result: {
        orderId: 'MOCK-' + Date.now(),
        paymentParams: {
          provider: 'wxpay',
          timeStamp: String(Date.now()),
          nonceStr: 'mock-nonce',
          package: 'prepay_id=MOCK',
          signType: 'MD5',
          paySign: 'MOCK_SIGN',
        },
      },
    }
  }

  // Product detail
  if (url.includes('/product/detail')) {
    return {
      code: '0',
      msg: 'ok',
      result: {
        id: 100,
        name: '模拟商品',
        image: 'https://placehold.co/200x200',
        price: 99.0,
        stock: 100,
      },
    }
  }

  // Fallback: return null to indicate not mocked
  return null
}
