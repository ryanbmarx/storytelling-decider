const marked = require("marked");
const cheerio = require("cheerio");

/**
 * Renders a stirng of text as markdown (which includes straight-up HTML). As a utility,
 * forces all anchor links to open in a new window and adds the proper rels.
 *
 * @param {string} txt A string of text, potentially with markdown or HTML, to be processed
 * @param {object} options
 * @param {boolean} options.inline | If true, block-element wrappers (like <p>) will be omitted
 * @param {boolean} options.smartypants | If true, will use smart quotes
 */

function processText(txt = "", options = {}) {
	const { inline = false, smartypants = true } = options;

	// Enable smart quotes
	marked.setOptions({
		smartypants,
	});

	// Run it through markdown, optionally omitting the block elements, like header or <p> tags
	let processedText = inline ? marked.parseInline(txt) : marked.parse(txt);
	// Make all the links open in new tabs
	processedText = makeLinksNewWindow(processedText);
	// Remove newlines because they don't matter in HTML and will make tests easier.
	return processedText.replace(/\n/g, "");
}

// Scrapes a string of HTML and makes the anchor links all open in new windows.
function makeLinksNewWindow(txt) {
	const $ = cheerio.load(txt, {}, false);

	const links = $("a");

	// Bail since we have no links to worry about.
	if (links.length < 1) return txt;

	links.each(function () {
		let rel = $(this).attr("rel") || "";
		// Make it an array
		rel = rel.split(" ");
		// Add the things we want to the array
		rel.push("noopener", "noreferrer");
		// Flatten and dedupe our array of rel values
		rel = Array.from(new Set(rel));
		// Set our attributes
		$(this).attr("rel", rel.join(" ").trim());
		$(this).attr("target", "_blank");

		$(this).addClass("cast-inline-link");
	});
	return $.html();
}

module.exports = { processText };
