<script setup lang="ts">
import { onMounted } from 'vue'

declare global {
  interface Window { adsbygoogle: unknown[] }
}

onMounted(() => {
  try {
    (window.adsbygoogle = window.adsbygoogle || []).push({})
  } catch {
    // AdSense can fail silently (adblock, site not yet approved, etc.)
  }
})
</script>

<template>
  <ins
    class="adsbygoogle"
    style="display:block"
    data-ad-client="ca-pub-3196127830509477"
    data-ad-slot="8198494105"
    data-ad-format="auto"
    data-full-width-responsive="true"
  />
</template>
