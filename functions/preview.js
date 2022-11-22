const { renderHTML } = require("./ssr.js");
const path = require("path");
const fs = require("fs/promises");

const NEWSROOM = process.env.PODCAST || "dev";
const RACE = process.env.RACE || "governor";

async function preview() {
	const contentPath = path.join(
		__dirname,
		`data/${NEWSROOM.toLowerCase()}`,
		`${RACE.toLowerCase()}.json`
	);

	const templatePath = path.join(__dirname, "index.template.html");
	const [content, template] = await Promise.all([
		fs
			.readFile(contentPath, { encoding: "utf-8" })
			.then(JSON.parse)
			.catch(console.error),
		fs.readFile(templatePath, { encoding: "utf-8" }).catch(console.error),
	]);

	const app = await renderHTML(content);

	const HTML = template.replace("{{BODY}}", app);

	// console.log(html);
	const outputPath = path.join(__dirname, "../public", `index.html`);
	return fs.writeFile(outputPath, HTML);
}

if (require.main === module) {
	preview().catch(console.error);
}
module.exports = { preview };
