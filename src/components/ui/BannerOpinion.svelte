<script>
	export let text =
		"This piece expresses the views of its author(s), separate from those of this publication.";
	export let title = "Opinion";
</script>

<style>
	.banner {
		--color-opinion: #eafe75;
		--banner-padding-horiz: 1rem;
		--banner-padding-vert: 0.5rem;
		background: transparent; /* Needed for UW reasons */
		min-height: calc(2 * var(--banner-padding-vert) + var(--font-line-height));
	}

	p {
		font: italic var(--font-size-small) / var(--font-line-height) var(--fonts-serif);
		text-align: center;
		background: var(--color-opinion);
		padding: var(--banner-padding-vert) var(--banner-padding-horiz);
		margin: 0;
		box-sizing: border-box;
	}

	.banner__inner {
		position: absolute;
		left: 0;
		width: 100%;
		z-index: 3;
	}

	strong {
		color: var(--color-font-muted);
		font-style: normal;
		font-family: var(--fonts-sans-serif);
		font-size: 1rem;
	}

	.invisible {
		visibility: hidden;
	}
</style>

<aside class="banner">
	<p class="banner__inner"><strong>{title}</strong> {text}</p>
	<p class="invisible"><strong>{title}</strong> {text}</p>
</aside>
