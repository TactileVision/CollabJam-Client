<template>
	<v-card>
		<v-card-title>
			Actuator Arrangement
		</v-card-title>
		<draggable v-model="localModelValue" group="people" @start="drag = true" @end="drag = false" item-key="deviceUuid + actuator" >
			<template #item="{ element : e }">

				<div class="actuator"> {{ e.actuator + 1 }} </div>
			</template>
		</draggable>

	</v-card>
</template>

<style lang="scss">
.actuator {
	display: inline-block;
	margin: 1em;
	padding: 1em;
	border-radius: 100%;
	background-color: gold;
	user-select: none;
}
</style>


<script lang="ts">
import { defineComponent } from 'vue';
import { ActuatorSelection } from '../TactileDisplayValidation';
import draggable from 'vuedraggable'
import { useStore } from 'vuex';

export default defineComponent({
	name: "ActuatorArrangement",
	components: { draggable },
	emits: ['update:modelValue'],
	data() {
		return {
			store : useStore(),
			drag: false,
		}
	},
	computed: {

		localModelValue: {
			get() {
				return this.modelValue
			},
			set(newValue: ActuatorSelection) {
				this.$emit('update:modelValue', newValue)
			},
		},
	},
	props: {
		modelValue: Object as () => ActuatorSelection
	}
})
</script>