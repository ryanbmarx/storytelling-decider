#!/usr/bin/env node
/*
Update stored content by pulling from a Google Sheet
*/

const path = require("path");
const fs = require("fs/promises");
const { processText } = require("./utils/text.js");
const { getMediaData } = require("./utils/get-media-data.js");
const { getArticles } = require("./utils/content-api.js");
const { slugify, auth, kv } = require("./utils/utilities.js");

process.env.GAPI_CLIENT_EMAIL = process.env.GAPI_CLIENT_EMAIL;
process.env.GAPI_PRIVATE_KEY = process.env.GAPI_PRIVATE_KEY;

// SET OUR TIME ZONE
process.env.TZ = "US/Eastern";

const NEWSROOM = process.env.PODCAST || "dev";

// The main google spreadsheet
const SPREADSHEET_IDS = {
	azcentral: "1dtu1TmmOi30Cewr612pYlLNDA20MJv4GyOeblCN6ezk",
	savannahnow: "1avByth7vtATmNq7z_PAEwE7jCUSpNKZEZ3bE_ekTYSY",
	// https://docs.google.com/spreadsheets/d/1OL6mTeI-Z1Tn4CHO6PJNLcErvZE15i53xuy4APW_eLA/edit#gid=69257696
	usatoday: "1OL6mTeI-Z1Tn4CHO6PJNLcErvZE15i53xuy4APW_eLA",
	dev: "1xoWhAT1jp9KW1vI_NNwCssRhUg4v23snOcrHLSTfTxA",
};
const CONTENT_PROTECTION_STATES = ["free", "premium", "registered", "metered"];

// These strings correspond to `top` properties. If they are present in the data, then they will be processed with markdown. This is for conveniene
const MARKDOWN_BY_DEFAULT = ["intro", "methodology"];

// Our sentiments
const DEFAULT_NODES = [
	{ value: -2, label: "Strongly disagree" },
	{ value: -1, label: "Disagree" },
	{ value: 0, label: "Unsure" },
	{ value: 1, label: "Agree" },
	{ value: 2, label: "Strongly agree" },
];

// MAIN DATA UPDATING: Will write to ./functions/data/content.json
async function update() {
	console.log("UPDATING DECIDERS FOR %s", NEWSROOM.toUpperCase());
	if (!SPREADSHEET_IDS[NEWSROOM]) {
		throw new Error(`No spreadsheet configured for newsroom: ${NEWSROOM}`);
	}

	const SPREADSHEET_ID = SPREADSHEET_IDS[NEWSROOM];

	const goot = await auth();

	const data = await goot.parse.table(SPREADSHEET_ID).catch(error => {
		console.error("!!! Gootenberg error: A blank spreadsheet tab will fail here.");
		console.error(error);
		process.exit();
	});

	// Do some rough processing of the data, making KV pairs, etc.
	let sheets = {};
	for (let [tab, content] of Object.entries(data)) {
		// Tabs beginning with an underscore are skipped.
		if (tab.indexOf("_") === 0) continue;

		if (content[0] && "key" in content[0] && "value" in content[0]) {
			sheets[tab] = kv(content);
		} else {
			sheets[tab] = content;
		}
	}
	const recommendations = sheets.recommendations.map(r => {
		r.percentage = parseInt(r.percentage);
		return r;
	});

	// Find out how many races there are ...
	const races = Object.keys(sheets).reduce((acc, curr) => {
		let split = curr.split("-");
		if (split.length === 2) {
			acc.add(split[1]);
		}
		return acc;
	}, new Set());

	races.forEach(async race => {
		console.log("Generating input data for %s", race);

		// Validate our input, ensuring we have all the spreadsheet tabs we need for a single race
		for (let required of ["top", "candidates", "prompts"]) {
			if (!sheets[`${required}-${race}`]) {
				throw new Error(`Required tab of ${required}-${race} is not found.`);
			}
		}

		// A "top" tab is elevated into top-level properties
		const top = sheets[`top-${race}`];

		// Enforce CPS. If we have one and it exists in our list of possible CPS values ...
		const content_protection_state = top?.content_protection_state ?? "free";
		if (CONTENT_PROTECTION_STATES.includes(content_protection_state)) {
			// ... normalize it to lower case.
			top.content_protection_state = content_protection_state.toLowerCase();
		} else {
			// ... default to "free."
			top.content_protection_state = "free";
		}

		if (!top.headline) top.headline = top.title;

		if (top.contributing)
			top.contributing = processText(top.contributing, { inline: true });

		const candidates = await Promise.all(
			sheets[`candidates-${race}`].map(async c => {
				const { image, image_alt, image_crop = "1_1" } = c;
				c.id = slugify(c.name);
				c.image = await getMediaData({ image, alt: image_alt, crop: image_crop });

				delete c.image_alt;
				delete c.image_crop;
				return c;
			})
		);

		// Select which of our two candidates will be the "negative" accumulation, called the "flip" candidate
		const flipCandidate = candidates[0].id;

		// Remove prompts w/o candidates and do some light processing
		let prompts = sheets[`prompts-${race}`]
			.filter(p => p.candidate)
			.map((c, index) => {
				c.topic = slugify(c.topic);
				c.candidate = slugify(c.candidate);
				c.text = processText(c.text, { inline: true });
				c.flip = c.candidate === flipCandidate;
				c.id = `${c.topic}-${c.candidate}-${index}`;
				return c;
			});

		// Randomize the prompt order:
		prompts = randomize(prompts);

		let topics = sheets[`topics-${race}`] || {};
		if (Object.values(topics).length > 1) {
			// Make sure we have proper slugs for everything
			// and convert topics to a lookup
			topics = sheets[`topics-${race}`].reduce((acc, curr) => {
				const { name, description } = curr;
				const id = slugify(name);
				acc[id] = {
					name,
					description,
					count: prompts.filter(p => p.topic === id).length,
				};

				return acc;
			}, {});
		}
		// For on-page stuff
		top.isOpinion = top.ssts.split("/")[0].toLowerCase() === "opinion" || false;

		// Coerce our dates
		if (top.published) top.published = new Date(top.published);
		top.updated = top.updated ? new Date(top.updated) : new Date();

		// Formulate site/domain-specific stuff we don't want to just get from the spreadsheet:
		try {
			top.url = new URL(top.url).toString() || "tk";
		} catch (e) {
			console.error("Error parsing canonical", e);
			console.error(top.url);
		}
		// const site_code = content.site_code;
		top.site_code = top.site_code.toUpperCase() || "USAT";

		for (let m of MARKDOWN_BY_DEFAULT) {
			if (top[m]) top[m] = processText(top[m]);
		}

		// Add default sentiment nodes
		const nodes = sheets.nodes ? sheets.nodes : DEFAULT_NODES;

		// Handle related links
		let related_links = [];
		if (sheets.related_links) {
			related_links = await sheets.related_links.reduce(
				async (accumulator, { presto_id, link, headline = "" }) => {
					let temp = await accumulator;
					if (link) {
						try {
							const u = new URL(link);
							temp.push({ link: u.toString(), headline });
						} catch (e) {
							console.error("Problem with link", link);
						}
					} else {
						try {
							const { assets } = await getArticles(presto_id);
							const asset = assets[0];

							let image = {};
							if (asset?.links?.photoId) {
								image = await getMediaData({ image: asset.links.photoId, crop: "4_3" });
							}

							if (asset) {
								temp.push({
									headline:
										headline || asset.shortHeadline || asset.headline || asset.title,
									link: asset.pageURL.long,
									image,
								});
							}
						} catch (e) {
							console.error("Problem getting related presto_id", presto_id);
							console.error(e);
						}
					}

					return temp;
				},
				Promise.resolve([])
			);
		}

		const output_path = path.join(
			__dirname,
			`data/${NEWSROOM.toLowerCase()}`,
			`${race.toLowerCase()}.json`
		);
		await fs.mkdir(path.join(__dirname, `data/${NEWSROOM}`), { recursive: true });
		return fs.writeFile(
			output_path,
			JSON.stringify(
				{ ...top, prompts, candidates, topics, related_links, nodes, recommendations },
				null,
				2
			)
		);
	});
}

// Takes an array and returns a scrambled-up version of the array
function randomize(prompts = []) {
	if (!prompts.length) return prompts;

	// Remove a prompt at random index from prompts and put it in the rando. Repeat
	const random = [];
	while (prompts.length) {
		const randomIndex = getRandomInt(0, prompts.length - 1);

		random.push(prompts[randomIndex]);
		prompts.splice(randomIndex, 1);
	}
	return random;
}

/**
 * Returns a random integer between min (inclusive) and max (inclusive).
 * The value is no lower than min (or the next integer greater than min
 * if min isn't an integer) and no greater than max (or the next integer
 * lower than max if max isn't an integer).
 * Using Math.round() will give you a non-uniform distribution!
 */
function getRandomInt(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

if (require.main === module) {
	update().catch(console.error);
}

module.exports = { update };
