<script>
	import { onMount } from "svelte";
	import { scale } from "svelte/transition";
	export let candidates = [];
	export let scores = {};
	export let totalPoints;
	export let debug = false;
	export let recommendations = [];

	let neutralWidth = `${recommendations[recommendations.length - 2].percentage * 2}%`;

	$: left = `${(100 * (scores.total + totalPoints)) / (totalPoints * 2)}%`;

	onMount(() => {});
</script>

<style>
	.gauge {
		--gauge-height: max(var(--agent-nav-height, 0), 2.5rem);
		--gauge-border-width: 3px;
		--gauge-line-height: 0.3rem;
		--gauge-neutral-height: 0.85rem;
		box-sizing: border-box;
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		background-color: var(--color-font);
		z-index: 10000000000;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem;
	}

	.candidate {
		position: relative;
		flex: 0 0 var(--gauge-height);
		height: var(--gauge-height);
		width: var(--gauge-height);
		border: var(--gauge-border-width) solid var(--color-background);
		border-radius: 50%;

		background-color: var(--color-background);
		background-position: center;
		background-repeat: no-repeat;
		background-size: cover;
	}

	.candidate__name {
		font: bold 0.8rem/1.3em var(--fonts-sans-serif);
		text-transform: uppercase;
		color: var(--color-background);
		opacity: 50%;
		position: absolute;
		top: 50%;
		margin: 0.5rem 0 0 0.5rem;
		left: 100%;
		width: max-content;
	}

	.candidate--right .candidate__name {
		margin: 0.5rem 0.5rem 0 0;
		left: unset;
		right: 100%;
	}

	.line {
		flex: 1 1;
		position: relative;
	}

	.line::after,
	.line::before {
		content: "";
		display: block;
		height: var(--gauge-line-height);
		width: 50%;
		position: absolute;
		top: 50%;
		left: 0;
		transform: translate(0, -50%);
		background-color: var(--color-background);
	}
	.line::after {
		left: unset;
		right: 0;
		background-color: var(--color-background);
	}

	.dot {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-flow: column nowrap;

		position: absolute;
		height: 1.5rem;
		width: 1.5rem;
		border-radius: 50%;
		top: 50%;
		z-index: 2;
		left: var(--left);
		transform: translate(-50%, -50%);
		transition: left 400ms ease-in-out;
		background: var(--color-highlight);
	}

	.dot::after {
		content: "";
		display: block;
		height: 100%;
		width: 100%;
		border-radius: inherit;

		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background: inherit;
		animation: pulse 2s 0s infinite;
	}

	.dot__label {
		font: bold 0.7rem/0.8em var(--fonts-sans-serif);
		z-index: 2;
	}
	.dot__label--total {
		font-weight: normal;
	}
	.neutral {
		display: flex;
		align-items: end;
		justify-content: center;

		border: 2px dashed var(--color-background);
		border-top: none;
		min-width: 4px;
		width: var(--width);
		height: var(--gauge-neutral-height);

		position: absolute;
		top: 100%;
		left: 50%;
		transform: translate(-50%, 0);
	}

	.neutral::after {
		content: "Neutral";
		font: bold 0.8rem/1em var(--fonts-sans-serif);
		text-transform: uppercase;
		color: var(--color-background);
		opacity: 50%;

		position: absolute;
		top: calc(var(--gauge-neutral-height) + 70%);
		left: 50%;
		transform: translate(-50%, 0);
	}

	@keyframes pulse {
		from {
			transform: translate(-50%, -50%) scale(1);
			opacity: 8;
		}
		to {
			transform: translate(-50%, -50%) scale(2);
			opacity: 0;
		}
	}
</style>

{#if debug}
	{@const [leftCandidate, rightCandidate] = candidates}
	<aside class="gauge">
		<div
			class="candidate candidate--left"
			style:background-image="url({leftCandidate?.image?.src}?width=100)">
			<span class="candidate__name">{leftCandidate.name}</span>
		</div>
		<div class="line">
			{#if totalPoints > 0}
				<span
					transition:scale={{ duration: 200, opacity: 0, start: 0 }}
					class="dot"
					style:left>
					<span class="dot__label">{scores.total}</span><span
						class="dot__label dot__label--total">{totalPoints}</span>
				</span>
			{/if}
			<span class="neutral" style:--width={neutralWidth} />
		</div>

		<div
			class="candidate candidate--right"
			style:background-image="url({rightCandidate?.image?.src}?width=100)">
			<span class="candidate__name">{rightCandidate.name}</span>
		</div>
	</aside>
{/if}
