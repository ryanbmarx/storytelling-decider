/* link utilities */

const CDN_ROOT =
	"https://www.gannett-cdn.com/usat-storytelling/storytelling-studio-apps";
const TARGET = process.env.TARGET || "dev";
const PROJECT_SLUG = process.env.PROJECT_SLUG;
const DEFAULT_ASSET_PATH = `${CDN_ROOT}/${TARGET}/${PROJECT_SLUG}/`;

export function urlFor(path, base) {
	base = base || undefined;
	const url = new URL(path, base);
	return url.toString();
}

export function base(domain = "www.usatoday.com") {
	let ASSET_PATH = process.env.ASSET_PATH || DEFAULT_ASSET_PATH;
	let BASE_URL;

	if (typeof window === "undefined") {
		BASE_URL = `https://${domain}/storytelling/${PROJECT_SLUG}`;

		return {
			BASE_URL,
			ASSET_PATH,
		};
	}

	if (!ASSET_PATH) ASSET_PATH = `${window.location.origin}/`;

	switch (window.location.hostname) {
		case "localhost":
		case "0.0.0.0":
			BASE_URL = ASSET_PATH = `${window.location.origin}/`;
			break;

		case "www.gannett-cdn.com":
			BASE_URL = ASSET_PATH;
			break;

		case "dev-uw.usatoday.com":
			BASE_URL = `https://dev-uw.usatoday.com/storytelling/${PROJECT_SLUG}/`;
			break;

		default:
			BASE_URL = `https://${window.location.hostname}/storytelling/${PROJECT_SLUG}/`;
	}

	return {
		BASE_URL,
		ASSET_PATH,
	};
}

/**
 *
 * addITMs() takes a link as a string and adds ITM parameters to it, returning the beefed-up, trackable link. 
 * 
 * @param {String} link A string of the URL we are linking to. A javascript URL object would work here, too, since `new URL()` also can handle them.
 * @param {Boolean} overwrite  If set to true, the passed params will replace existing values in the link. Default behavior is to honor params as passed, and only ADD new ones.
 * @param {Object} params An object of key-value pairs where the key is the desired param and the value is the param value. An example `params` would be:
 * ```json
 * {
    itm_source:"usat-weekly-news-quiz",
    itm_medium:"summary",
    itm_campaign:"2021-02-11"
  }
```
 *
 * @returns {String} The link we want with our params added
 */
export function addITMs(link = "", params = {}, overwrite = false) {
	// Bail if we have no link or ITMs to add. Just return the link.
	if (!link || Object.keys(params) < 1) return link;
	try {
		// Make a URL object
		const u = new URL(link);
		// Create a copy of the params already on the URL
		const existingParams = u.searchParams;

		// For each of the ITM parameters we want to add...
		for (let param in params) {
			// ... make sure it's not already set. If it is set, honor it. If not, then add it.
			// If overwrite is true, then who cares what the value is. Force the issue.
			if (!existingParams.has(param) || overwrite) {
				u.searchParams.set(param, params[param]);
			}
		}
		// Return our new, ITM-filled link as a string.
		return u.toString();
	} catch (e) {
		// There was a problem, so send the link back and hope they know what they're doing with it. Vaya con dios.
		console.error("Error parsing link for ITMs: %s", e);
		return link;
	}
}
