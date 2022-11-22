<script>
	import { fly } from "svelte/transition";
	import Checkbox from "./ui/Checkbox.svelte";
	import Button from "./ui/Button.svelte";
	import { fireEvent } from "../utils/analytics";

	export let selectedTopics;
	export let topics_header;
	export let topics = [];
	export let start = () => {};
	export let start_button_label_topics;
	export let start_button_label_no_topics;
	export let label_select_all;
	export let label_unselect_all;
	export let hasTopics = true;

	// So we can check/uncheck all
	let topicRefs = {};
	let checkedAll = false;

	$: label = checkedAll ? label_unselect_all : label_select_all;

	function selectAll(e) {
		checkedAll = !checkedAll;
		for (let box of Object.values(topicRefs)) {
			box.checked = checkedAll;
		}
		fireEvent({
			category: "decider",
			action: "select all topics",
			label: `Total topics: ${Object.keys(topics).length}`,
		});
	}
</script>

<style>
	.topics {
		margin: 2rem 0;
	}
	.topics__header {
		font: bold 1.2rem/1.3em var(--fonts-sans-serif);
		margin: 0;
	}
	.topics__list {
		list-style: none;
		margin: 0;
		padding: 0;

		display: grid;
		gap: 2rem;
		grid-template: auto / repeat(auto-fill, minmax(14rem, 1fr));
	}

	.topics__start {
		width: 100%;
	}

	.topics__start--sticky {
		position: fixed;
		bottom: 10vh;
		left: 0;
		z-index: 3;
	}

	.topics__start :global(#start) {
		max-width: 90%;
		position: relative;
		width: 100%;
		box-shadow: 3px 3px 6px rgba(0, 0, 0, 0.4);
	}

	.topics__all {
		box-sizing: border-box;
		padding: 0.5rem 0 1.5rem 0;
		margin: 0;
		min-height: var(--touch-target);
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: flex-start;

		font: italic var(--font-size-small) / 1em var(--fonts-sans-serif);
		color: var(--color-font);
		border: none;
		cursor: pointer;

		background: var(--color-background);
	}
	.topics__all:focus {
		outline: 1px solid var(--color-accent);
	}
	.topics__all:hover {
		text-decoration: underline;
	}

	@media all and (min-width: 768px) {
		.topics {
			padding: 3rem 0;
		}

		.topics__start--sticky {
			position: static;
		}

		.topics__start {
			width: 20rem;
			margin: 1rem auto;
		}

		.topics__all {
			width: -moz-fit-content;
			width: fit-content;
		}
	}
</style>

<section class="topics">
	{#if hasTopics}
		<h3 class="topics__header">{topics_header}</h3>
		<button class="topics__all" on:click={selectAll}>{label}</button>
		<ul class="topics__list">
			<!-- Filter our list of topics down to just what has the required name field-->
			{#each Object.entries(topics).filter(([_, { name, description }]) => {
				return !!name;
			}) as [id, { name, description = null }]}
				<li>
					<Checkbox
						bind:this={topicRefs[id]}
						bind:group={$selectedTopics}
						on:input
						value={id}
						{id}
						label={name}
						{description} />
				</li>
			{/each}
		</ul>
		{#if $selectedTopics.length}
			<div
				transition:fly={{ duration: 200, y: 100 }}
				class="topics__start topics__start--sticky">
				<Button
					id="start"
					class="ring"
					on:click={start}
					label={start_button_label_topics}
					muted={!$selectedTopics.length} />
			</div>
		{/if}
	{:else}
		<div transition:fly={{ duration: 200, y: 100 }} class="topics__start">
			<Button
				id="start"
				class="ring"
				on:click={start}
				label={start_button_label_no_topics} />
		</div>
	{/if}
</section>
