const Gootenberg = require("gootenberg");

/*
Index rows by key
*/
function makeIndex(rows = [], key = "id") {
	return rows.reduce((m, d) => {
		m[d[key]] = d;
		return m;
	}, Object.create(null));
}

/*
Turn a sheet with key and value columns into a key-value object
*/
function kv(rows = []) {
	return rows.reduce((m, d) => {
		if (d.value && d.value != "") m[d.key] = d.value;
		return m;
	}, Object.create(null));
}

/**
 *
 * Takes an array of rows and an array of required fields. Each required field is confirmed in each row, or else a fatal error is thrown.
 * @param {array} rows
 * @param {array} required
 * @param {string} identifier
 * @returns Nothing
 */
function validate(rows, required, identifier = "") {
	console.log(`++ Validating ${identifier}`);

	// For each row ...
	for ([index, row] of Object.entries(rows)) {
		// ... for each required field ...
		for (let field of required) {
			// ... and stop everything with a helpful error if anything is missing
			if (!row[field]) {
				throwError(
					"1",
					`!!! ${identifier} index No. ${index} is missing or has invalid \`${field}\``
				);
			}
		}
	}
}

/**
 *
 * This function throws a fatal error (to stop the build process) and sends a message to MSFT Teams
 *
 * @param {String} exitCode | The node exit code we want. Non-zero should be fatal to processes
 * @param {String} text | The error text
 */
function throwError(exitCode = "1", text = "") {
	process.exitCode = exitCode; // Set the exit code to prevent future calls.
	if (text) throw text; // Scream real loud!
	// TODO: Ping teams.
}

async function auth() {
	const goot = new Gootenberg();
	return goot.auth.jwt();
}

/**
 *
 * @param {*} val A value to be coerced from vernacular English into a javascript boolean value.
 * @param {boolean} def The default value (true or false) if a boolean cannot be determined. Defaults to false.
 *
 * @returns {boolean} an acutal boolean, true or false
 */
function truthy(val = "", def = false) {
	const bools = {
		false: false,
		no: false,
		n: false,
		true: true,
		yes: true,
		y: true,
	};

	// If it already is a boolean, then return it.
	if (val === true || val === false) return val;

	// If we account for it in our list, then use that value
	if (val.toLowerCase() in bools) return bools[val.toLowerCase()];

	return def;
}

/**
 *	Util function that takes a string and makes it a nice, slugified version. To do this, we:
	- split the words, then join on hyphens
	- make it lower case
	- pull punctuation
 * 
 * @param  {...any} words A string with as many words as you want.
 * @returns {string} Slugified version of `words`
 */
function slugify(...words) {
	return words
		.join("-")
		.toLowerCase()
		.replace(/[,.]+/g, "")
		.replace(/\s+/g, "-")
		.replace(/^-|-$/, "");
}

module.exports = { kv, makeIndex, validate, auth, truthy, slugify };
