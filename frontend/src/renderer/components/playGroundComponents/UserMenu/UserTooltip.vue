<template>
	<v-dialog v-model="dialog" persistent width="auto">
		<template v-slot:activator="{ props }">
			<v-btn prepend-icon="mdi-account" :color="users.length == 0 ? 'error' : 'primary'" v-bind="props">
				Users ({{ users.length }})

			</v-btn>
		</template>
		<v-card min-width="1000px">
			<v-card-title class="text-h5">
				Users
			</v-card-title>
			<!-- <v-card-text>Let Google help apps determine location. This means sending anonymous location data to Google,
					even when no apps are running.</v-card-text> -->
			<v-card-text>
				<!-- {{ users }} -->
				<v-list>
					<v-list-item v-for="user in users" :key="user.id"
						:title="user.name.length == 0 ? 'Unnamed User' : user.name">
						<template v-slot:prepend>
							<v-icon :color="user.color" icon="mdi-account" size="x-large" class="mr-4"></v-icon>
						</template>
					</v-list-item>
				</v-list>
			</v-card-text>
			<v-card-actions>
				<v-spacer></v-spacer>
				<v-btn color=" primary" variant="text" @click="dialog = false">
					Go Back
				</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>
<style lang="scss" scoped></style>

<script lang="ts">
import { defineComponent } from "@vue/runtime-core";
import { User } from "@sharedTypes/roomTypes"
import { PropType } from "vue";
export default defineComponent({
	name: "UserTooltip",
	props: {
		users: {
			type: Array as PropType<User[]>,
			required: true
		}
	},
	data() {
		return {
			dialog: false,

		}
	},

})
</script>