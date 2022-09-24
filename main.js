import Fuse from "fuse.js";
import "virtual:windi.css";

// todo pre-search filtering available
// todo change search item UI
// opensearch icon
// disabled pointer
// todo refactor

const form = document.querySelector("form");
const input = document.querySelector("input");
const button = document.querySelector("button");
const output = document.querySelector("#output");

let fontList = [],
	fonts = "",
	urlParam = "",
	apiUrl = "https://api.fontsource.org/v1/fopnts";

// Fuse.js specific class and function to create fuzzy search queries
class Query {
	constructor(name, value) {
		this[name] = value;
	}
}

const createSearchQuery = (query) => {
	let keywords = query.split(" "),
		queryList = [];

	keywords.forEach((keyword) => {
		queryList.push(new Query("family", keyword));
	});

	return queryList;
};

// searches fonts and returns results
const searchFonts = (query) => {
	if (!query || !query.trim()) {
		return [];
	}

	let searchQuery = query.trim();

	const fuse = new Fuse(fontList, {
		threshold: 0.2,
		keys: ["family"]
	});

	return fuse
		.search({
			$or: createSearchQuery(searchQuery)
		})
		.map((el) => el.item);
};

// makes search and populates results
const populateResults = (query) => {
	// null query string
	if (query === null) {
		output.innerHTML = "";
		return;
	}

	let searchResults = searchFonts(query);

	// empty results
	if (searchResults.length === 0) {
		output.innerHTML = `
			<div
				class="bg-blue-gray-800 text rounded-md text-center w-full mx-auto my-8 p-6">
				No matches found.
			</div>
		`;
		return;
	}

	fonts = "";

	searchResults.forEach((res) => {
		fonts += `
			<details
				class="px-4 py-3 bg-blue-gray-800 mb-4 rounded-md focus-within:ring-2 ring-emerald-500 ring-opacity-50 ring-offset-0 rounded-md focus-within:outline-none">
				<summary
					class="flex w-full justify-between items-center cursor-pointer focus:outline-none">
					<i class="gg-chevron-right-o"></i>
					<span class="mr-auto">${res.family}</span>
					<a
						class="focus:outline-none focus:bg-blue-gray-900 rounded-full p-2 text-blue-gray-500"
						href="https://fontsource.org/fonts/${res.id}"
						target="_blank" rel="noopener">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="2"
							stroke="currentColor"
							class="w-5 h-5">
							<path
							stroke-linecap="round"
								stroke-linejoin="round"
								d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
						</svg>
					</a>
				</summary>
				<ul class="mt-3">
					<li>Category: ${res.category}</li>
					<li>Variable: ${res.variable}</li>
					<li>Weights: ${res.weights.join(", ")}</li>
					<li>Styles: ${res.styles.join(", ")}</li>
					<li>Version: ${res.version}</li>
				</ul>
				<code>yarn add @fontsource/${res.id}</code>
				<code>import "@fontsource/${res.id}"</code>
				<code>body { font-family: "${res.family}", ${res.category}; }</code>
			</details>
    `;

		output.innerHTML = fonts;
	});
};

// get url parameters if any exist and reset input
const init = () => {
	input.value = "";
	let parsedUrl = new URL(window.location.href);
	urlParam = parsedUrl.searchParams.get("q");
	input.value = urlParam ? urlParam : "";
};

init();

fetch(apiUrl)
	.then((res) => {
		if (res.ok) return res.json();
		throw new Error("Network response was not ok.");
	})
	.then((data) => {
		fontList = data.slice();

		// make UI accessible after fonts are loaded
		input.removeAttribute("disabled");
		button.removeAttribute("disabled");
		input.setAttribute("placeholder", "Enter font name");

		// if url has a url parameter, fill input and make search
		if (urlParam) {
			input.value = urlParam;
			populateResults(urlParam);
		}
	})
	.catch((err) => {
		output.innerHTML = `
			<div
				class="bg-blue-gray-800 text rounded-md text-center w-full mx-auto my-8 p-6">
				An error has occured when loading the fonts. 
				<br/>
				Please try again in a few seconds.
			</div>
		`;
		input.setAttribute("placeholder", "An error has occured.");
	});

form.addEventListener("submit", (e) => {
	e.preventDefault();

	// update url parameter with new search query
	let parsedUrl = new URLSearchParams(window.location.search);
	parsedUrl.set("q", input.value);
	window.history.pushState({}, "", `?${parsedUrl}`);

	populateResults(input.value);
});

window.addEventListener("popstate", (e) => {
	init();

	populateResults(urlParam);
});
