<template>
	<v-navigation-drawer>
		<v-list>
			<!-- <v-list-group> -->

				<!-- <v-list-subheader title="Tactile Illusions"></v-list-subheader>
				<v-divider></v-divider> -->
				<v-list-item @click="go(routes.DOOR)" link title="Door example"></v-list-item>
				<v-list-item @click="go(routes.FUNNELING)" link title="Funneling Illusion"></v-list-item>
				<v-list-item @click="go(routes.ATM)" link title="Apparent Tactile Motion"></v-list-item>
				<v-list-item @click="go(routes.SALTATION)" link title="Saltation"></v-list-item>
			<!-- </v-list-group> -->
			<!-- <v-list-group> -->
				<!-- <v-list-subheader title="Jamming"></v-list-subheader>
				<v-divider></v-divider> -->
				<v-list-item @click="go(routes.ROOM)" link title="CollabJam"></v-list-item>
			<!-- </v-list-group> -->
			<!-- <v-list-group> -->
			<!-- <v-list-subheader title="Hardware"></v-list-subheader>
			<v-divider></v-divider> -->
			<v-list-item @click="go(routes.DEVICES)" title="Tactile Displays"></v-list-item>
			<!-- <v-list-item title="Sensors"></v-list-item> -->
			<!-- </v-list-group> -->
		</v-list>
	</v-navigation-drawer>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { routes } from "@/app/router/routes"
import router from "@/app/router";
import { RouterNames } from './router/Routernames';

export default defineComponent({
	name: "Sidebar",
	data() {
		return {
			routeEntries: routes,
			routes: RouterNames
		}
	}, methods: {
		go(route: RouterNames) {
			const r = this.routeEntries.find(e => e.name == route)
			if (r == null) return
			router.push(r.path)

		}
	}
})
</script>