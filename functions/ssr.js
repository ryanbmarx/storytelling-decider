#!/usr/bin/env node
require = require("esm")(module);
require("svelte/register");
const fs = require("fs/promises");
const path = require("path");
const UW = require("./utils/uw.js");
const App = require("../src/App.svelte").default;
const minify = require("html-minifier").minify;

const { json_ld } = require("./utils/json-ld.js");
const { justGetPhotoURL } = require("./utils/get-media-data.js");

const TARGETS = {
	staging: "dev",
	dev: "dev",
	preprod: "master",
	preview: "master",
	production: "master",
	master: "master",
	main: "master",
};
const TARGET =
	process.env.TARGET in TARGETS ? TARGETS[process.env.TARGET] : TARGETS.dev;

const PROJECT_SLUG = process.env.PROJECT_SLUG || "decider";

// A lookup for taking required_status and turning it into a `contentProtectionStatus` suitable for Gannett's Google Analytics CD27
const CONTENT_PROTECTION_STATES = {
	subscriber: "premium",
	premium: "premium",
	registered: "free",
	metered: "metered",
	any: "free",
};

async function render(filePath = "", newsroom = "", race = "") {
	console.log(`++ Rendering UW response for (${TARGET})`, { newsroom, race });

	// process.env.PROJECT_SLUG
	const ASSET_PATH = `https://www.gannett-cdn.com/usat-storytelling/storytelling-studio-apps/${TARGET}/${PROJECT_SLUG}/`;
	const content = await fs.readFile(filePath).then(JSON.parse);
	const { url, site_code } = content;

	// CPS
	const contentProtectionState =
		CONTENT_PROTECTION_STATES[content.content_protection_state] || "free";

	const scripts = [
		{
			type: "text/javascript",
			src: new URL(`bundle.js`, ASSET_PATH),
			defer: "defer",
		},
	];

	const styles = [new URL(`bundle.css`, ASSET_PATH), new URL(`global.css`, ASSET_PATH)];

	let share_image;
	try {
		// Start by using the configured image
		share_image = await justGetPhotoURL(content.share_image);
	} catch (e) {
		console.error("!! Problem getting share image: %s", e);
	}

	// HANDLE SSTS, ETC.
	let ssts = content.ssts || "";
	let cst = content.cst || content.ssts || "";

	const jsonld = json_ld({
		ssts: content.ssts,
		date_modified: new Date(content.updated).toISOString(),
		date_published: new Date(content.published).toISOString(),
		title: content.title,
		canonical_url: url,
		site_code,
		share_image,
		is_accessible_for_free: contentProtectionState === "free",
		paywalled_content_css_selector: [],
	});

	const metadata = {
		scripts,
		styles,
		headline: content.headline || content.title,
		title: content.title,
		description: content.description,
		share_text: content.share_text || "",
		share_image,
		ssts,
		cst,
		url,
		jsonld,
		date_published: new Date(content.published).toISOString(),
		includesVideo: content.includesVideo || false,
		contentProtectionState,
	};
	const response = UW({
		html: renderHTML(content),
		...metadata,
	});

	// Make sure we have the directory we need
	await fs.mkdir(path.join(__dirname, `../public/uw/${newsroom}`), {
		recursive: true,
	});

	return fs.writeFile(
		path.join(__dirname, `../public/uw/${newsroom}`, `${race}`),
		JSON.stringify(response)
	);
}

// One function to render all of the HTML we would want for an initial state.
// It's good for both SSR and preview rendering

/**
 *
 * @param {Object} content The full page-date object
 * @returns {String} Fully rendered HTML for the page
 */
function renderHTML(content = {}) {
	// Suppress any logging that might come from the app itself
	console.log = () => {};

	// Get our HTML rendered in the roadblocked state
	// If it is set to no CPS, then true, otherwise, not.
	const { html } = App.render(content);

	return minify(
		`<div id="${PROJECT_SLUG}" class="app">${html}</div><script type="application/json" id="${PROJECT_SLUG}-data">${JSON.stringify(
			content
		)}</script>`,
		{
			minifyCSS: true,
			minifyJS: true,
			collapseWhitespace: true,
		}
	);
}

async function renderAll() {
	// Get list of all dirs in data
	const folders = await fs.readdir(path.join(__dirname, "data"), {});

	// For each folder in functions/data...
	for (let folder of Object.values(folders)) {
		const files = await fs.readdir(path.join(__dirname, `data/${folder}`), {});
		// ... render a page for each file found in there.
		for (let file of Object.values(files)) {
			const UWPath = path.join(__dirname, `data/${folder}`, file);
			render(UWPath, folder, file);
		}
	}
}

if (require.main === module) {
	// Render the UW response.
	renderAll().catch(console.error);
}

module.exports = {
	render,
	renderAll,
	renderHTML,
};
