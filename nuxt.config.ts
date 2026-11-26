export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  typescript: { strict: true },
  css: ['~/assets/main.css'],
  runtimeConfig: {
    adminPassword: '',
    sessionPassword: '',
  },
})
