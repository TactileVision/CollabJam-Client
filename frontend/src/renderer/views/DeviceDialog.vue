<template>
	<!-- <v-row justify="center"> -->
		<v-dialog v-model="dialog" persistent width="auto">
			<template v-slot:activator="{ props }">
				<v-btn color="primary" prepend-icon="mdi-hand-pointing-right" v-bind="props">
					Tactile Displays
				</v-btn>
			</template>
			<v-card min-width="1000px">
				<v-card-title class="text-h5">
					Manage Tactile Displays
				</v-card-title>
				<DeviceSection></DeviceSection>
				<!-- <v-card-text>Let Google help apps determine location. This means sending anonymous location data to Google,
					even when no apps are running.</v-card-text> -->
				<v-card-actions>
					<v-spacer></v-spacer>
					<v-btn color="green-darken-1" variant="text" @click="dialog = false">
						Go Back
					</v-btn>
				</v-card-actions>
			</v-card>
		</v-dialog>
	<!-- </v-row> -->
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import DeviceSection from '../components/deviceComponents/DeviceSection.vue';

export default defineComponent({
	data() {
		return {
			dialog: false,
		};
	},
	components: { DeviceSection }
})
</script>