<script>
	import { fireEvent, firePageView } from "./utils/analytics.js";
	import { onMount, afterUpdate } from "svelte";
	import { writable } from "svelte/store";
	import { fly } from "svelte/transition";
	import { scrollToNode } from "./utils/scroll.js";
	import { isNativeApp } from "./utils/is-native-app.js";

	// COMPONENTS
	import Byline from "./components/ui/Byline.svelte";
	import Timestamp from "./components/ui/Timestamp.svelte";
	import Button from "./components/ui/Button.svelte";
	import BannerOpinion from "./components/ui/BannerOpinion.svelte";
	import { Cube, CubeMobile } from "@gannettdigital/storytelling-advertisements";

	import Results from "./components/Results.svelte";
	import Related from "./components/Related.svelte";
	import Topics from "./components/Topics.svelte";
	import Footer from "./components/Footer.svelte";
	import Prompt from "./components/Prompt.svelte";
	import Gauge from "./components/Gauge.svelte";

	export let headline;
	export let subheadline;

	export let byline = "Staff";
	export let organization = "USA TODAY NETWORK";
	export let intro;
	export let contributing;
	export let methodology_header = "Methodology: How we made this";
	export let methodology;
	export let share_label = "Share this with your friends";

	export let ssts;
	export let presto_id;
	export let isOpinion = false;
	export let content_protection_state = "free";

	// Various labels and texts
	export let topics_header =
		"Select the topics that are meaningful to you then click begin";
	export let agreement_by_topic_label = "On the topic of ...";

	export let start_button_label_topics = "After selecting topics, let's begin";
	export let start_button_label_no_topics = "Let's begin";
	export let label_no_topics_selected = "Please select some topics to continue";
	export let label_select_all = "Select all topics";
	export let label_unselect_all = "Unselect all topics";
	export let label_restart = "Disagree with the results? Try again.";

	// TIMESTAMPS
	export let published;
	export let updated;

	export let nodes = []; // Our sentiments
	export let topics = []; // From the spreadsheet, all the topics
	export let candidates = []; // From the spreadsheet, all the candidates.
	export let prompts = []; // From the spreadsheet, all the available prompts
	export let recommendations = []; // From the spreadsheet, all our "scoring" responses

	export let related_links_header = "Related";
	export let related_links = [];

	let promptRefs = {}; // Refs to each prompt component in the DOM
	let started = false;
	let scores = { total: 0 }; // Scores by topic
	let showResults = false; // When true, we'll display the agreement
	let navHeight = 56;
	let debug = false;

	const currentPromptIndex = writable(0); // How far along is the reader? Prompt 0
	const sectionTransition = { duration: 250, y: -25 }; // To keep things uniform.
	const selectedTopics = writable([]); // Which topics does the reader want?
	const hasTopics = Object.keys(topics).length > 1;

	// Based on topic, what prompts should we show
	$: selectedPrompts = hasTopics
		? prompts.filter(p => $selectedTopics.includes(p.topic))
		: prompts;

	// How many prompts are selected
	$: totalPrompts = selectedPrompts.length;

	// This will be false until we reach the end of the selected prompts. We'll use this to disable the sentiment selection once we are "complete"
	$: finished = selectedPrompts.length && $currentPromptIndex >= selectedPrompts.length;

	onMount(() => {
		// For easier debugging
		const { href } = window.location;
		if (href.includes("deciderDebug")) debug = true;

		const build = isNativeApp();
		console.log({ build });
		if (build.includes("native")) {
			const nav = document.querySelector(
				"util-sticky-module[util-module-path='elements/util']"
			);

			console.log({ nav });
			nav.parentNode.removeChild(nav);
			document.body.style.setProperty("--agent-nav-height", "0");
		}

		if (debug) {
			console.log({
				recommendations,
				candidates,
				topics,
				nodes,
				related_links,
				prompts,
			});
		}

		// Confirm the navHeight
		const nav = document.querySelector("#navContainer");
		if (nav) navHeight = nav.offsetHeight;

		// LISTEN FOR WHEN IT IS TIME TO FIRE A PAGEVIEW
		if (window?.gciAnalytics?.isReady) {
			// Analytics are ready
			firePageView({ cps: content_protection_state, contentId: presto_id });
		} else {
			// Wait for analytics to load, then fire the pageview
			document.addEventListener("gciAnalyticsReady", () => {
				firePageView({ cps: content_protection_state, contentId: presto_id });
			});
		}
	});

	function handlePromptSelection() {
		const { dataset, value } = this;
		const prompt = promptRefs[dataset.index];

		if (prompt.checked) {
			// If it is checked, we need to subtract the old selection first
			scores.total -= parseInt(prompt.previousValue);
			scores.total += parseInt(value);
			// Log the new selection, in case we change our mind again
			prompt.previousValue = value;
		} else {
			prompt.checked = true;
			prompt.previousValue = value;
			scores.total += parseInt(value);
		}
	}

	// When the user has selected topics and wants prompts
	function start(e) {
		started = true;
		// Decider experience is started | `decider` | `started` | `{n} of {total} topics selected`

		fireEvent({
			category: "decider",
			action: "started",
			label: `${$selectedTopics.length} of ${
				Object.keys(topics).length
			} possible topics selected`,
		});
	}

	// This function takes the scores and selected the appropriate agreement
	function score() {
		for (let prompt of Object.values(promptRefs)) {
			let value = prompt.sentiment;
			const topic = prompt.topic;

			// Add the score, falling back to the value on the occasion of this is the first time we've scored that topic
			if (scores[topic]) {
				scores[topic] += value;
			} else {
				scores[topic] = value;
			}
			scores.total += value;
		}
		if (debug) console.log({ scores });
	}
	function getAgreement(topic = "total") {
		// Set this here to keep the operations below as logic-free as possible. Can't set it earlier since the number of prompts is somewhat dynamic.
		topics["total"] = { count: selectedPrompts.length };

		const percent = (scores[topic] / topics[topic].count) * 2 * 100;

		// console.log({ percent });
		let text = "";
		let neutral = false;
		// for (let r of recommendations) {
		for (let i = 0; i < recommendations.length; i++) {
			if (Math.abs(percent) >= recommendations[i].percentage) {
				text = recommendations[i].text;

				// If it is the last, then flag it as a neutral agreement
				neutral = i === recommendations.length - 1;
				break;
			}
		}

		// If the agreement is neutral, them don't send a candidate and return the text
		if (neutral) {
			const candidate = candidates[2] ? candidates[2] : null;
			return { candidate, text };
		} else {
			// There is an agreement. Format the text and send the agreed candidate
			const candidate = percent > 0 ? candidates[1] : candidates[0];
			return {
				candidate,
				text: text
					.replace("{candidate}", `<strong>${candidate.name}</strong>`)
					.replace("{party}", candidate.party),
			};
		}
	}

	// For when you want to start over. Reset the state and jump to the top.
	function reset() {
		$currentPromptIndex = 0;
		scores = { total: 0 };
		$selectedTopics = [];
		started = false;
		showResults = false;
		window.scrollTo({
			top: 0,
			left: 0,
			behavior: "smooth",
		});
		fireEvent({
			category: "decider",
			action: "restarted",
			label: "state refreshed",
		});
	}
</script>

<style>
	:global(#decider) {
		--color-highlight: lightgoldenrodyellow;
		--checkbox-size: 1.75rem;
		--checkbox-margin: 1rem;
		--padding-horiz: 1rem;
		--agent-nav-height: 55px;

		background-color: var(--color-background);
		padding: 0 var(--padding-horiz) var(--padding-horiz) var(--padding-horiz);
		max-width: 50rem;
		margin: 0 auto var(--padding-horiz) auto;
		box-shadow: 0px 0 26px 4px rgba(0, 0, 0, 0.5);
	}
	:global(#decider > *:not(:last-child)) {
		margin-bottom: 2rem;
	}

	.headline {
		font: bold var(--font-size-very-large) / var(--font-line-height)
			var(--fonts-sans-serif);
		color: var(--color-font);
		margin-bottom: 1rem;
	}
	.subheadline {
		font: italic var(--font-size-medium-large) / var(--font-line-height)
			var(--fonts-serif);
		color: var(--color-font);
		font-weight: normal;
		margin-bottom: 1rem;
	}

	header > :global(*) {
		margin: 0 0 1rem 0;
	}

	.results-button-wrapper {
		margin-top: 1rem;
	}

	:global(#show-results) {
		max-width: 20rem;
		position: relative;
		width: 100%;
		box-shadow: 3px 3px 6px rgba(0, 0, 0, 0.4);
	}

	@media all and (min-width: 768px) {
		:global(#decider) {
			--padding-horiz: 2rem;
		}
	}
</style>

<header>
	{#if isOpinion}
		<BannerOpinion />
	{/if}
	{#if headline}<h1 class="headline">{headline}</h1>{/if}
	{#if subheadline}<h2 class="subheadline">{subheadline}</h2>{/if}
	<div>
		<Byline {byline} {organization} />
		<Timestamp {updated} {published} />
	</div>
	{#if intro}{@html intro}{/if}
</header>
{#if !started}
	<Topics
		{label_select_all}
		{label_unselect_all}
		{topics_header}
		{topics}
		{start_button_label_no_topics}
		{start_button_label_topics}
		{start}
		{hasTopics}
		{selectedTopics} />
{/if}
<Cube {ssts} />
<CubeMobile {ssts} />
{#if started}
	<section class="prompts" transition:fly={sectionTransition}>
		{#each selectedPrompts as prompt, index (prompt.id)}
			<Prompt
				on:input={debug ? handlePromptSelection : null}
				bind:this={promptRefs[index]}
				{nodes}
				{sectionTransition}
				disable={showResults}
				{...prompt}
				{debug}
				{index}
				{totalPrompts}
				{navHeight}
				{currentPromptIndex} />
		{:else}
			<p>{label_no_topics_selected}</p>
		{/each}
		{#if finished && !showResults}
			<div
				class="results-button-wrapper"
				transition:fly={{ duration: 200, y: 100 }}
				use:scrollToNode>
				<Button
					id="show-results"
					class="ring"
					on:click={e => {
						score();
						showResults = true;
						fireEvent({
							category: "decider",
							action: "results tabulated",
							label: "results",
						});
					}}
					label="Calculate results" />
			</div>
		{/if}
	</section>
{/if}

<Results
	{hasTopics}
	{related_links}
	{agreement_by_topic_label}
	{sectionTransition}
	{scores}
	{topics}
	{getAgreement}
	{headline}
	visible={showResults}
	{share_label}
	{label_restart}
	{reset} />

<Related
	{related_links_header}
	{related_links}
	{sectionTransition}
	visible={showResults} />

<Footer {methodology} {methodology_header} {contributing} {ssts} />
<Gauge
	{candidates}
	{scores}
	totalPoints={selectedPrompts.length * 2}
	{debug}
	{recommendations} />
