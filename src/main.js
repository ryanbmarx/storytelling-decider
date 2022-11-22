import App from "./App.svelte";

const props = JSON.parse(document.querySelector("#decider-data").innerText);

const app = new App({
	hydrate: true,
	target: document.querySelector("#decider"),
	props,
});

export default app;
