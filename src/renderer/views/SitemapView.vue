<template>
  <ul>
    <li v-for="(route, i) in routeEntries" :key="i">
      <a @click="go(route.path)"> {{ route.name }}</a>
    </li>
  </ul>
</template>

<script lang="ts">
import { routes } from "@/renderer/router/routes";
import { defineComponent } from "vue";

export default defineComponent({
  name: "SitemapView",
  data() {
    return {
      routeEntries: routes,
    };
  },
  methods: {
    go(path: string) {
      this.$router.push(path);
    },
  },
});
</script>
