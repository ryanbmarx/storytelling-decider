# Storytelling Studio apps

TODO: 

- Analytics, presto ID in PVs
- SSR
- Multiple races in one spreadsheet
- Better summary design
- Recirc 


## Analytics

### Pageviews

Unlike previous S2 apps, this app will set the `contentId` in `ga_data`, which populates CD14 in Google analytics data. From the spreadsheet, the value of `top.presto_id` is fed to CD14 and is intended to be the presto ID of the nonstory promo for the individual decider.

### Events

Event | Category | Action | Label
---|---|---|---
Decider experience is started | `decider` | `started` | `{n} of {total} topics selected`
Prompt sentiment is selected | `decider` | `prompt sentiment selected` | `{n} of {total} prompts`
Results are tabulated | `decider` | `results tabulated` | `results`
Recirc link is clicked | `internal/outbound links` | `decider recirc link` | `to: {href}`
Social share | `Outbound links` | 	`decider share` | `{network} share`
Social button: page URL is copied | `content` | `Copy URL clicked copy` | `{URL copied}` 
Reader restarts the experience from the results view | `decider` | `restarted` | `state refreshed` 

_Prompts are 1-indexed, meaning the first prompt is 1 of {total}_


This is a project template for [Svelte](https://svelte.dev) apps using [Rollup](https://rollupjs.org). Hopefully you've cloned this into [storytelling-studio-apps](https://github.com/GannettDigital/storytelling-studio-apps), which handles most deployment and testing tasks.

_Note that you will need to have [Node.js](https://nodejs.org) installed._


## Creating a new project

1. Use this template

First, `cd` into your projects directory. If this is a Storytelling Studio app, then you should `cd` into there. To create a new project based on this template using [degit](https://github.com/Rich-Harris/degit):

```bash
npx degit GannettDigital/s2-apps-template <new-project-slug>
cd <new-project-slug>
```

!!! Caution
    Your project directory will become the project slug used for deployment, so choose carefully. Calling your project _election_ is bad, _election-2022_ is slightly better, _election-faq-2022_ is much better.

2. Install the dependencies

Each project should have a `Makefile` with several key steps (more on that later in "publishing"). For now, just `cd` into your new project directory and run the install command.

```bash
cd <new-project-slug>
make install
```
3. Start the server

All S2 apps use the `npm run dev` command to start up any needed development processes, such as a dev server. Unless you've changed something, your "Hello World" svelte app should be visible at `https://localhost:5000`

```bash
npm run dev
```
4. Get working

The dev server will listen on `$PORT` (5000 by default). Navigate to [localhost:5000](http://localhost:5000). You should see your app running. Edit a component file in `src`, save it. The page should reload with your changes.

## Connecting to Google Docs and Sheets

You should be doing this any time there's an editor or reporter involved. Which is to say, almost every project. We use [gootenberg](https://github.com/The-Politico/gootenberg) to pull files from Google Drive. We use a shared Google service account and [JWT authentication](https://github.com/The-Politico/gootenberg/blob/master/docs/docs.jwt.md). If you don't have credentials, please ask.

You will need:

- An environment variable, `$GOOGLE_AUTH_FILE`, pointing to the location of a credentials file (again, ask if you don't have this)
- a spreadsheet or document key, or both, or many of those, depending on the project

From there, follow the Gootenberg docs to download and parse [documents with ArchieML](https://github.com/The-Politico/gootenberg/blob/master/docs/parse.archie.md) or [spreadsheets as JSON](https://github.com/The-Politico/gootenberg/blob/master/docs/parse.table.md). These usually live in a `data` task in `gulpfile.js`.

Out of the box, there is a very rudimentary script to grab and process the spreadsheet: `./functions/data.js`. This simple function will grab the contents of the spreadsheet and:

1. Tabs _with_ `key` and `value` columns are turned into dictionaries (i.e. key/value pairs) at `data.<tab name>`.
2. Tabs without a `key` column will be processed into an array of objects at `data.<tab name>`.
3. If you have a `top` tab, the contents of that tab will be turned into key-value pairs at the top-level of the data object.

This data function can become as big and complex as needed. Edit it to suit your needs.

!!! Caution
    To facilitate publishing, **ALL** data processes should be run with `make update`. However long the data processes are, they need to be linked here.

## Using Content API

We can fetch data about Presto assets, which can save us the trouble of managing media or large text files. You'll need `$CONTENT_API_KEY` defined. See past projects for example GraphQL code.

There are some utility functions in this repo to make it easier to get images, videos and story content. See the function files for more detailed documentation.

### `./functions/utils/get-media-data.js`

- `getMediaData()`: An all-purpose function that takes a presto ID _or_ image URL and returns a data object with all needed info in one place. Give it caption, credit and/or alt text and get it all back, wrapped up together 
- `justGetPhotoURL()`: Does what it says on the tin. This is useful for getting share image URLs from presto IDs.

### `./functions/utils/content-api.js`

- `getArticles()`: Takes one or more article IDs and returns the story metadata (headlines, links, etc.)
- `getContentPackage()`: Takes the Presto ID of a contentpackage/storyline and gets it.

## Other useful utilies

### Colors

Good color contrast is important! There are a couple utils in `./functions/utils/colors.js` to make this easier:

- `getOverlayColor()` takes a theme color and gives you the best color for text (`black` or `white`).
- `getUtilityColors()` is a somewhat imprecise function that takes a single color and returns an object with four colors in hex value: the main color provided, a good, lighter version for background screens and text colors for both values.


## Where to put data

For the most part, we're dealing with small amounts of data for each project. By the time it reaches us, whatever data we need should be clean and well-organized. If it's not, we should be talking to the reporters and editors we're working with and/or building in time to do that work.

For small data files, it's often easiest to simply import a JSON (or CSV) file into our codebase. That way everything is available immediately, without waiting for an AJAX call. We don't need a loading state because the data is already loaded.

In these cases, data should live in the `src/content` directory. One plugin, `rollup-plugin-json` is already installed. For CSV, install [`rollup-plugin-dsv`](https://github.com/rollup/rollup-plugin-dsv).

If that doesn't work, or if we need to load data asynchronously, data can live in `public` and be loaded via `fetch()`. Just remember to handle cases where requests take longer than expected or fail entirely.

## What's in the repo?

This repo contains a bevy of possibly useful, reusable components and utiltities and things. In most cases, greater details on usage are found in the files themselves. Here are some highlights:

### Static

The static directory — `./src/static` — is a good place to put images or any other static assets you want to save. Currently, only a small, global CSS file lives in there. Static assets are duplicated into the public folder with `npm run static` and on `make build`.

### Javascript utils

Also available are some other functions

- `./src/utils/is-internal.js` Will determine if a URL is Gannett owned, or not. This is useful for analytics when determing `internal` or `outbound` links.
- `./src/utils/analytics.js` has the main `firePageview()` and `fireEvent` functions.
- `./src/utils/links.js` can be used to dynamically build asset links (such as images or document) that either look locally or on the CDN depending on the dev environment.
- `./src/utils/watch-for-element.js` has functions that will look for elements on the page and fire an even when they are viewable.

### Advertisements

The components in `src/components/ads` can be included and used as needed. They will handle any extra logic or scripts. **Mobile and non-mobile ads must be added seperately.** See the readme in that directory for more detailed information

### UI elements

A somewhat catch-all collection of helpful pieces. Look in each component for more details.

- Lots and lots of svg icons (email, social networks, arrows, etc.) as svelte components. Be sure to set the `title` property for maximum accessibility.
- Byline and timestamp: Handy, tangent-looking metadata. Good for page <header> elements.
- `Image.svelte` Takes all the things a good image needs, including height and width attributes, and gives you a performant, well-formed image.
- `Video.svelte` Takes all the things a good video needs and gives you a well-formed one.
- Checkbox, text input and styled select.
- A fully-featured set of share buttons, with webshare and copy url.
- A button that gives you a fully accessible `<button>` or `<a>` (as approrpiate) styled to look like a button.

## Publishing

### UW responses and static rendering

The vasty majority of projects will need to be delivered as a Universal Web response. The `render()` function in `./functions/ssr.js` is a simple, boilerplate static renderer. It requires a value (provided in the file or from the spreadsheet) for:

- `title` (and maybe `headline`)
- `share_image`
- `share_description`
- `modified`
- `published`
- `content_protection_state`
- `ssts`
- canonical URL
- a paywall CSS selector for ld+json purposes
- an `includesVideo` boolean
- a site_code



### Deploying

For the most part, this is automated. The include `Makefile` runs two commands on every pull request and merge: `install` and `build`. Running those commands should put a fully rendered app in `public/`, which a github action will upload to the CDN.

If you need to build more frequently, or without going through a PR process, a `deploy.sh` script is included. Please use this judiciously.

You'll need to have Google Cloud configured locally, plus two environment variables for this to work:

- `$CDN_AUTH`
- `$USAT_AUTH`

Both variables allow you to cache bust assets on deploy. Again, use wisely.

#### Automated deployment

Storytelling Studio apps can use a Github action to update, build and publish.  To facilitate this, a Makefile with suitable commands is required. The action workflow will trigger each command in sequence:

- `make update`: All data fetching and processing should be executed with this command. It could be a bash script, node script, or just some inline commands. Whatever you need.
- `make build`: All build processes should live in this command, including (probably) `npm run build` for the linked assets and whatever your static rendering step is (which should result in a Universal Web repsonse). 
- `make deploy`: Will run `./deploy.sh`
- `make preprod`: Will run `./deploy.sh --preprod`
- `make publish`: Will run `./deploy.sh --production`