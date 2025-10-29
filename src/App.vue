// App.vue
<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app'

// 1. 在 <script setup> 顶层（但在 onLaunch 之外）
//    添加一个全局守卫变量
let interceptorsConfigured = false

onLaunch(() => {
  console.log('App Launch')

  // 2. 检查这个守卫
  if (!interceptorsConfigured) {
    // ---- 开启全局导航监控 ----
    setupNavigationInterceptor()

    // 3. 设置守卫，确保不再重复执行
    interceptorsConfigured = true
    console.log('全局导航拦截器已配置。')
  } else {
    // 如果你刷新了，你会看到这条日志
    console.log('导航拦截器已配置，跳过重复设置。')
  }
})

/**
 * 辅助函数：打印当前页面栈 (优化版)
 * @param {string} fromEvent - 标记
 */
const logCurrentPages = (fromEvent: string) => {
  const pages = getCurrentPages()

  // 健壮性检查
  if (!pages || pages.length === 0) {
    console.log(`[${fromEvent}] 页面栈为空`)
    return
  }

  // 1. 打印完整的页面栈数组（用于调试）
  const allRoutes = pages.map((p) => p.route)
  console.log(`[${fromEvent}] 页面栈 (共 ${pages.length} 页):`, allRoutes)

  // 2. (新功能) 明确地、单独地打印出当前页面
  const currentPage = pages[pages.length - 1]
  console.log(`[${fromEvent}] ➡️➡️➡️ 当前页面是: ${currentPage.route}`)
}

/**
 * 设置全局导航拦截器
 */
const setupNavigationInterceptor = () => {
  const navTypes = ['navigateTo', 'redirectTo', 'reLaunch', 'switchTab', 'navigateBack']

  navTypes.forEach((navType) => {
    uni.addInterceptor(navType, {
      // 1. 导航触发时 (invoke)
      invoke(args) {
        console.log(`--- 触发导航 [${navType}] ---`)
        console.log(`参数:`, args)
        logCurrentPages(`before ${navType}`) // 打印导航前的页面栈

        // return true // (可选) 如果你想在某些情况下阻止导航，可以返回 false
      },

      // 2. 导航成功后 (success)
      success() {
        // 使用 setTimeout 确保页面栈已经更新完毕
        setTimeout(() => {
          logCurrentPages(`after ${navType} success`) // 打印导航成功后的页面栈
        }, 0)
      },

      // 3. 导航失败后 (fail)
      fail(err) {
        console.error(`!!! [${navType}] 失败:`, err)
        logCurrentPages(`after ${navType} fail`)
      },
    })
  })
}
</script>

<style>
/*每个页面公共css */
</style>
