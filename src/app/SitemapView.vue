<template>
  <ul>
    <!-- <li v-for="(route, i) in routeEntries" v-bind:key="i">
			<a @click="go(route.path)"> {{ route.name }}</a>
		</li> -->
  </ul>
</template>

<script lang="ts">
// import { router } from "@/app/router";
// import { routes } from "@/app/router/routes"
import { defineComponent } from "vue";

export default defineComponent({
  name: "Sitemap",
  data() {
    return {
      // routeEntries: routes
    };
  },
  methods: {
    go(path: string) {
      // router.push(path)
    },
  },
});
</script>
