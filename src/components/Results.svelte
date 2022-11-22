<script>
	import { fly } from "svelte/transition";

	import Image from "./ui/Image.svelte";
	import SocialShare from "./ui/SocialShare.svelte";
	import Button from "./ui/Button.svelte";

	export let visible = false;
	export let sectionTransition = {};
	export let scores = {};
	export let topics = {};
	export let getAgreement = () => {};
	export let headline, share_label;
	export let hasTopics = true;
	export let reset = () => {};
	export let label_restart = "";
</script>

<style>
	.agreement {
		padding-top: var(--agent-nav-height);
		margin-top: calc(-1 * var(--agent-nav-height));
	}
	.agreement__topics {
		margin: 2rem 0;
		padding: 1rem;
		list-style: none;
		background: var(--color-highlight);
	}

	.agreement__topic {
		font: var(--font-size) / 1.3rem var(--fonts-sans-serif);
		margin: 1rem 0;
		gap: 1rem;
		align-items: center;
		display: grid;
		grid-template-rows: 1fr;
		grid-template-columns: 5fr 2fr 7fr;

		margin: 0 0 0.5rem 0;
		padding: 0 0 0.5rem 0;
		border-bottom: 1px solid var(--color-font-very-muted);
	}

	.agreement__topic:last-child {
		margin-bottom: 0;
		padding-bottom: 0;
		border-bottom: none;
	}

	.agreement__topic__name {
		grid-column: 1;
		font-weight: bold;
		/* text-align: right; */
	}

	.agreement__topic :global(.agreement__topic__image) {
		flex: 0 0 60px;
		grid-column: 2;
	}
	.agreement__topic__text {
		grid-column: 3;
	}

	.agreement__main {
		display: flex;
		gap: 1rem;
		align-items: center;
		justify-content: center;
		flex-flow: row-reverse wrap;
		margin: 0 0 1rem 0;
	}
	.agreement :global(.agreement__image) {
		flex: 0 0 150px;
		text-align: center;
		border: 10px solid var(--color-highlight);
		border-radius: 50%;
	}
	.agreement :global(img) {
		border-radius: 50%;
	}
	.agreement :global(.image__credit) {
		margin: 0;
	}

	.agreement__text {
		flex: 1 1 280px;

		display: flex;
		flex-flow: column nowrap;
		gap: 0.5rem;
	}

	.agreement__header {
		font: bold 1.5rem / 1.3em var(--fonts-sans-serif);
		margin: 0;
	}
	.agreement__header :global(strong) {
		background: var(--color-highlight);
		padding: 0.25rem 0.5rem;
	}

	.agreement__description {
		margin: 0;
	}

	/* NO IMAGE IN FINAL RECOMENDATION */

	.no-image .agreement__header {
		text-align: center;
		margin: 1rem auto;
	}

	.agreement__restart {
		margin: 1rem 0 3rem 0;
	}

	:global(#restart) {
		max-width: 20rem;
		position: relative;
		width: 100%;
	}

	@media all and (min-width: 768px) {
		.agreement__topic {
			grid-template-columns: 4fr 1fr 9fr;
		}
		/* NO IMAGE IN FINAL RECOMENDATION */

		.no-image .agreement__header {
			margin: 2rem auto;
		}
	}
</style>

{#if visible}
	<div
		transition:fly={sectionTransition}
		class="agreement"
		class:no-image={!getAgreement("total")?.candidate?.image?.src}>
		<div class="agreement__main">
			<div class="agreement__text">
				<h2 class="agreement__header">{@html getAgreement("total").text}</h2>
				{#if getAgreement("total")?.candidate?.description}
					<p class="agreement__description">
						{@html getAgreement("total").candidate.description}
					</p>
				{/if}
			</div>
			{#if getAgreement("total")?.candidate?.image?.src}
				<Image
					class="agreement__image"
					{...getAgreement("total").candidate.image}
					caption={null}
					credit={null}
					widths={[100, 200, 300, 400, 500]}
					sizes={"(min-width: 768px) 33vw, 100vw"} />
			{/if}
		</div>
		{#if hasTopics}
			<ul class="agreement__topics">
				{#each Object.keys(scores) as key}
					<!-- We present total above, so skip it. -->
					{#if key !== "total"}
						<li class="agreement__topic">
							<span class="agreement__topic__name">{topics[key].name}</span>
							<Image
								class="agreement__topic__image"
								{...getAgreement(key)?.candidate?.image}
								caption={null}
								credit={null}
								widths={[50, 100, 150]}
								sizes={"100px"} />
							<span class="agreement__topic__text">{@html getAgreement(key).text}</span>
						</li>
					{/if}
				{/each}
			</ul>
		{/if}
		<div class="agreement__restart" transition:fly={{ duration: 200, y: 100 }}>
			<Button id="restart" class="" on:click={reset} label={label_restart} />
		</div>

		<SocialShare
			label={share_label}
			linkedin={false}
			outlines={true}
			iconsOnly={true}
			alignment="center"
			project="decider"
			shareHeadline={headline} />
	</div>
{/if}
