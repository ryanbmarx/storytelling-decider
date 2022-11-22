<script>
	import { fly } from "svelte/transition";
	import { fireEvent } from "../utils/analytics";
	import { scrollToNode } from "../utils/scroll.js";

	export let text = "";
	export let topic = "";
	export let candidate;
	export let flip;
	export let id;
	export let currentPromptIndex;
	export let disable = false;
	export let index;
	export let sectionTransition;
	export let nodes = [];
	export let sentiment; // The ultimate value we want this prompt to return
	export let navHeight;
	export let totalPrompts;
	export let debug = false;

	let checked = false;

	const nodeRefs = [];

	$: visible = index <= $currentPromptIndex;

	// function scrollPrompt(node) {
	// 	if (typeof window !== "object") return;

	// 	const rect = node.getBoundingClientRect();
	// 	const { top } = rect;

	// 	const target = window.scrollY + window.innerHeight / 2 + top;
	// 	console.log({
	// 		target,
	// 		top,
	// 		"window.scrollY": window.scrollY,
	// 		"window.innerHeight": window.innerHeight,
	// 	});
	// 	window.scrollTo({ behavior: "smooth", top: target });
	// }

	function initNode(node) {
		nodeRefs.push(node);
	}

	function handleInput(e) {
		checked = true;
		sentiment = this.value;
		nodeRefs.forEach(n => {
			if (n.checked) {
				n.parentNode.classList.add("prompt__sentiment--checked");
			} else {
				n.parentNode.classList.remove("prompt__sentiment--checked");
			}
		});

		// Prompt sentiment is selected | `decider` | `sentiment selected` | `{n} of {total} prompts`
		fireEvent({
			category: "decider",
			action: "prompt sentiment selected",
			label: `${index + 1} of ${totalPrompts} total prompts`,
		});

		// If this is the last available prompt, then increment the counter
		if (index === $currentPromptIndex) $currentPromptIndex += 1;
	}
</script>

<style>
	.prompt {
		padding: 2rem 0;
		width: 100%;
		border-bottom: 1px solid var(--grey-medium-light);
		transition: background-color 150m ease-in-out;
	}

	.prompt:last-of-type {
		border-bottom: none;
	}

	.prompt__text {
		font: bold 1rem / 1.3em var(--fonts-sans-serif);
	}

	.prompt__sentiments {
		margin: 1rem 0 0 0;
		padding: 0;
		list-style: none;

		display: grid;
		gap: 0.25rem;
		grid-template-columns: repeat(5, minmax(1px, 1fr));
	}

	.prompt__sentiment {
		font: var(--font-size-small) / 1.3em var(--fonts-sans-serif);
		text-align: center;
		cursor: pointer;
		display: flex;
		flex-flow: column nowrap;
		align-items: center;
		justify-content: flex-end;
		gap: 0.25rem;
		height: 100%;
		box-sizing: border-box;
		padding: 1rem 0.5rem;

		transition: color 150ms ease-in-out, background-color 150ms ease-in-out;
	}
	.prompt__sentiment input {
		cursor: inherit;
		display: block;
		margin: 0;
	}

	/* ----- STATE: CURRENT PROMPT */

	.current {
		background-color: var(--color-highlight);
		padding: var(--padding-horiz);
		margin: 0 calc(-1 * var(--padding-horiz));
		width: calc(100% + 2 * var(--padding-horiz));
		box-sizing: border-box;
	}

	.current .prompt__sentiment {
		background-color: rgba(255, 255, 255, 0.65);
		padding: 0.5rem 1rem;
	}

	/* ----- OUR FAKE PROMPT */

	.prompt__input {
		appearance: none;
		visibility: hidden;
		position: absolute;
		top: 0;
		left: 0;
		display: block;
	}

	.prompt__radio {
		--radio-height: 1.75rem;
		--radio-width: var(--radio-height);
		--radio-border-width: 2px;

		cursor: pointer;
		display: block;

		height: var(--radio-height);
		width: var(--radio-width);

		position: relative;
		border-radius: 50%;
		color: var(--radio-color-border, var(--color-font));
	}

	.prompt__radio::before {
		content: "";
		display: block;

		border: var(--radio-border-width) solid currentColor;
		transition: border-color 75ms ease-in-out;

		border-radius: 50%;
		width: calc(100% - var(--radio-border-width));
		height: calc(100% - var(--radio-border-width));

		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
	}

	.prompt__radio::after {
		content: "";
		display: block;
		height: calc(100% - (3 * var(--radio-border-width)));
		width: calc(100% - (3 * var(--radio-border-width)));
		border-radius: 50%;
		background-color: var(--color-accent);

		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%) scale(0);
		transform-origin: center center;
		transition: transform 75ms ease-in-out;
	}

	.prompt__input:checked + .prompt__radio {
		color: var(--color-accent);
	}
	.prompt__input:checked + .prompt__radio::after {
		transform: translate(-50%, -50%) scale(1);
	}

	/* ----- STATE: DISABLED PROMPTS */

	.disabled {
		--color-highlight: var(--grey-light);
	}
	.disabled .prompt__sentiment {
		cursor: not-allowed;
	}

	.prompt__input[disabled] + .prompt__radio {
		--color-accent: var(--color-font-very-muted);
		color: var(--color-font-very-muted);
		cursor: not-allowed;
	}

	/* ----- STATE: WHEN A SELECTION IS MADE  */

	.checked .prompt__sentiment {
		color: var(--color-font-very-muted);
	}

	.checked .prompt__sentiment--checked {
		font-weight: bold;
		color: var(--color-font);
		background-color: var(--color-highlight);
	}

	.checked .prompt__radio {
		color: var(--color-font-very-muted);
	}
</style>

<svelte:options accessors={true} />

{#if visible}
	<div
		in:fly={sectionTransition}
		use:scrollToNode
		class="prompt"
		class:current={index === $currentPromptIndex}
		class:disabled={disable}
		class:checked
		{id}
		data-candidate={candidate}
		data-topic={topic}
		data-index={index}>
		<p class="prompt__text">{@html text}</p>
		{#if debug}
			<small style="font: bold 0.8rem/1em sans-serif;opacity: 0.6">
				candidate: {candidate} | topic: {topic} | flip: {flip}
			</small>
		{/if}
		<ul class="prompt__sentiments">
			{#each nodes as { value, label }}
				<li>
					<label class="prompt__sentiment" class:prompt__sentiment--checked={null}>
						{label}
						<input
							class="prompt__input"
							use:initNode
							disabled={disable ? true : null}
							bind:group={sentiment}
							on:input={handleInput}
							on:input
							name={id}
							data-index={index}
							value={flip ? -1 * value : value}
							type="radio" />
						<span class="prompt__radio" />
					</label>
				</li>
			{/each}
		</ul>
	</div>
{/if}
