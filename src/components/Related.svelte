<script>
	import { fly } from "svelte/transition";
	import { fireEvent } from "../utils/analytics";
	import { isInternal } from "../utils/is-internal.js";
	import Image from "./ui/Image.svelte";

	export let sectionTransition = {};

	export let related_links = [];
	export let related_links_header = "";
	export let visible = false;

	$: display = visible && related_links.length;

	function relatedClick(e) {
		fireEvent({
			category: isInternal(this.href) ? "internal links" : "outbound links",
			action: "decider recirc link",
			label: `to: ${this.href}`,
		});
	}
</script>

<style>
	.related {
		--related-border: 0.5rem;
		--related-padding: 1rem;

		display: none;
		gap: 1rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	.visible.related {
		display: flex;
	}

	.related__header {
		flex: 1 1 100%;
		font: bold 1.2rem / 1.3em var(--fonts-sans-serif);
		text-align: center;
	}

	.related__link {
		flex: 1 1 300px;
		display: block;
		min-height: 3.9em; /* Min height of three lines of text. That should keep things more regular looking */

		font: bold var(--font-size) / 1.3em var(--fonts-sans-serif);
		color: var(--color-font);
		text-decoration-color: var(--color-accent);

		display: flex;
		gap: 1rem;
		align-items: center;

		border-left: var(--related-border) solid transparent;
		background: var(--grey-light);
		padding: var(--related-padding);
		padding-right: calc(var(--related-padding) - var(--related-border));
		transition: border-color 150ms ease-in-out;
	}

	.related__link:hover,
	.related__link:focus,
	.related__link:focus-within {
		border-color: var(--color-accent);
	}

	.related__link:focus,
	.related__link:focus-within {
		outline: 2px solid var(--color-accent);
	}

	.related__link__text {
		flex: 3 3 300px;
	}
	.related__link :global(.related__link__image) {
		flex: 1 1 100px;
	}
</style>

{#if display}
	<div class="related" class:visible transition:fly={sectionTransition}>
		<h3 class="related__header">{related_links_header}</h3>
		{#each related_links as { headline, link, image }}
			<a
				on:click={relatedClick}
				class="related__link"
				href={link}
				target="_blank"
				rel="noopener noreferrer">
				<Image
					class="related__link__image"
					{...image}
					caption=""
					credit=""
					decorative={true}
					widths={[50, 100, 150, 200, 250, 300]}
					sizes="(min-width: 768px) 150px, 100vw" />
				<span class="related__link__text">{headline}</span>
			</a>
		{/each}
	</div>
{/if}
