<template>
  <el-container class="h-full">
    <!-- 侧边栏 -->
    <el-aside :width="isCollapse ? '64px' : '220px'" class="bg-[#304156] transition-all">
      <div class="h-[60px] flex items-center justify-center bg-[#263445]">
        <el-icon class="text-white text-2xl"><DataLine /></el-icon>
        <span v-show="!isCollapse" class="ml-2 text-white text-lg font-bold">快工后台</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
        router
      >
        <el-menu-item v-for="route in menuRoutes" :key="route.path" :index="'/' + route.path">
          <el-icon><component :is="route.meta?.icon" /></el-icon>
          <template #title>{{ route.meta?.title }}</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <!-- 顶部导航 -->
      <el-header class="bg-white shadow-sm flex items-center justify-between px-4">
        <div class="flex items-center">
          <el-icon 
            class="text-xl cursor-pointer hover:text-primary" 
            @click="isCollapse = !isCollapse"
          >
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>
        </div>
        <div class="flex items-center">
          <el-dropdown>
            <span class="flex items-center cursor-pointer">
              <el-avatar :size="32" class="bg-primary">
                {{ authStore.admin?.nickname?.charAt(0) || 'A' }}
              </el-avatar>
              <span class="ml-2">{{ authStore.admin?.nickname || '管理员' }}</span>
              <el-icon class="ml-1"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="handleLogout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 主内容区 -->
      <el-main class="bg-[#f0f2f5] p-4">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Fold, Expand, ArrowDown, DataLine } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const isCollapse = ref(false)

const activeMenu = computed(() => route.path)

const menuRoutes = computed(() => {
  const mainRoute = router.options.routes.find(r => r.path === '/')
  return mainRoute?.children || []
})

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}

onMounted(() => {
  if (!authStore.admin && authStore.token) {
    authStore.fetchAdminInfo()
  }
})
</script>
