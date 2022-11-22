<script>
	import { Cube, CubeMobile } from "@gannettdigital/storytelling-advertisements";

	export let methodology;
	export let methodology_header;
	export let contributing;
	export let ssts;
</script>

<style>
	.footer > :global(*:not(:last-child)) {
		margin-bottom: 1rem;
	}

	.methodology summary {
		cursor: pointer;
		font: bold 1rem/1.3rem var(--fonts-sans-serif);
	}

	.contributing {
		font: var(--font-size-small) / 1.3em var(--fonts-sans-serif);
		color: var(--color-font-muted);
	}
</style>

<section class="footer">
	{#if methodology}
		<details class="methodology">
			<summary>{methodology_header}</summary>
			{@html methodology}
		</details>
	{/if}
	{#if contributing}
		<p class="contributing">{@html contributing}</p>
	{/if}
</section>
