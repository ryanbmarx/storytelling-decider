import cloneDeep from "lodash/cloneDeep";
// polyfill
// https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent#Polyfill

const BROWSER = typeof window !== "undefined" && typeof document !== "undefined";

// Set this for larger projects
const EVENT_MODULE_NAME = "interactives";

(function () {
	if (!BROWSER) return;

	if (typeof window.CustomEvent === "function") return false;

	function CustomEvent(event, params) {
		params = params || { bubbles: false, cancelable: false, detail: undefined };
		const evt = document.createEvent("CustomEvent");
		evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
		return evt;
	}

	CustomEvent.prototype = window.Event.prototype;

	window.CustomEvent = CustomEvent;
})();

function clone(obj) {
	if (null == obj || "object" != typeof obj) return obj;
	const copy = obj.constructor();
	for (const attr in obj) {
		if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
	}
	return copy;
}

/**
 * fireEvent will fire either a UW-compliant event (`ga-event`)
 * or a Google Analytics-compliant view event
 *
 * @param {Object|String} payload - An object with `{ category, action, label }`, or, as a fallback, the string of the action being fired (the string payloads are deprecated).
 * @param {String} payload.category - The category string
 * @param {String} payload.action - The action string
 * @param {String} payload.label - The category label
 * @param {Object} data - an optional object that will be added to the event detail (default: `{}`)
 */
export function fireEvent(payload, data = {}) {
	let detail;
	if (typeof payload === "object") {
		const route =
			typeof window !== "undefined" && window.gaData && window.gaData.route
				? window.gaData.route
				: {};

		const { contentId = 0, basePageType = "" } = route;
		const { category = "", action = "", label = "" } = payload;
		detail = {
			"client-action": `${category}|${action}`,
			"event-label": label,
			"event-module-name": EVENT_MODULE_NAME,
			"event-type": "custom",
			"content-id": contentId,
			"content-type": basePageType,
			"event-paywall-state": "",
		};
		if (window.gciAnalytics && typeof window.gciAnalytics.view == "function") {
			window.gciAnalytics.view(detail);
		}
		if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev")
			console.log(`gci-track-data`, detail);
	} else {
		const { route } = getDefaultGAData();

		detail = {
			payload,
			data,
			route,
		};
		window.dispatchEvent(new CustomEvent("ga-event", { detail }));
		if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev")
			console.log(`ga-event`, detail);
	}
}

// The list of CPSs we care about.
const CONTENT_PROTECTION_STATES = ["free", "premium", "registered", "metered"];

/**
 *
 * Fires a Google Analytics pageview suitable for Gannett data collection. It toggles between noting free and premium story.
 *
 * @param {Object} options
 * @param {String} options.cps The content protection state that should be reflected. Acceptable values are contained in `const CONTENT_PROTECTION_STATES`
 * @param {String} options.contentId optional, a desired presto ID to populate CD14 for ease in analytics report-building
 */
export function firePageView({ cps = "free", contentId = null }) {
	let gaData = {
		route: {
			url: window.location.href,
			name: document.title,
		},
	};

	if (typeof ga_data !== "undefined") gaData = clone(ga_data);
	gaData.route.url = window.location.href;

	const detail = {
		route: gaData.route,
		name: gaData.name,
	};

	// Make sure the content protection state matches the page experience. Default is "free", but "premium" can be passed in.
	if (CONTENT_PROTECTION_STATES.includes(cps.toLowerCase())) {
		detail.route.cam.contentProtectionState = cps;
	} else {
		detail.route.cam.contentProtectionState = "free";
	}

	// If a unique slug is provided,
	if (contentId) {
		detail.route.contentId = contentId;
	}

	console.log("ga-page-view", detail);
	window.dispatchEvent(
		new CustomEvent("ga-page-view", {
			detail,
		})
	);
}

/**
 * This either:
 * 	1) clones the ga_data object when present
 * 	2) sets some default variables in ga_data.route
 *
 * @returns {Object} - a cloned ga_data object, or some defaults
 */
function getDefaultGAData() {
	var gaData = {};

	// we need to pass info from `ga_data.route` down to the page view event
	// this reads from `ga_data` for this, or sets some dummy data if it doesn't exist
	if (typeof ga_data !== "undefined") gaData = cloneDeep(ga_data);
	else gaData.route = { url: window.location.href, name: document.title };

	return gaData;
}
