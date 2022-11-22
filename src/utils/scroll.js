export function scrollToNode(node) {
	if (typeof window !== "object") return;

	const { top } = node.getBoundingClientRect();

	const target = window.scrollY + top - window.innerHeight / 2;
	console.log({
		target,
		top,
		"window.scrollY": window.scrollY,
		"window.innerHeight": window.innerHeight,
	});
	window.scrollTo({ behavior: "smooth", top: target });
}
