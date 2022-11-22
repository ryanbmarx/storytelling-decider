// The `build` query param will be set to one of these when run inside the android/ios apps
const NATIVE_APP_IDENTIFIERS = [
	"native-web_a_p", // = Android Phone
	"native-web_a_t", // = Android Tablet
	"native-web_a_u", //= Android Unknown
	"native-web_i_p", // = iOS Phone
	"native-web_i_t", // = iOS Tablet
	"native-web_i_u", // = iOS Unknown
];

/**
 * Tell us whether we're in a native app or normal web
 *
 * @returns {Boolean} true if this is a native app
 * @export
 */
export function isNativeApp() {
	if (typeof window !== "object") return "";
	const url = new URL(window.location);
	const build = url.searchParams.get("build");

	if (NATIVE_APP_IDENTIFIERS.indexOf(build) > -1) {
		return build;
	}

	return "";
}
