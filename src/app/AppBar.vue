<template>
	<v-app-bar id="appBar" :elevation="1">
		<v-btn icon="mdi-home" @click="go('/')">
		</v-btn>
		<v-app-bar-title>
			Tactile Bits
		</v-app-bar-title>
		<v-btn icon="mdi-devices" @click="go('/devices')">
		</v-btn>
	</v-app-bar>
</template>
<script lang="ts">
import { defineComponent } from "@vue/runtime-core";
import router from "@/app/router";
import DeviceDialog from "@/core/DeviceManager/views/DeviceDialog.vue";
export default defineComponent({
	name: "AppBar",
	// components: { DeviceDialog },
	data: () => ({
	}), methods: {
		go(path: string) {
			router.push(path)
		}
	}
})
</script>