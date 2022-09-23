import Fuse from "fuse.js";
import "virtual:windi.css";

// todo update threshold
// todo make efficient
// todo sync query param with input
// todo empty search results
// todo responsive design
// todo pre-search filtering available
// todo init - loading fonts message
// todo add opensearch spec
// todo handle fetch exception
// todo change search item UI
// todo fix input delay from url query
// todo rerun search on page change (back or forward)
// todo refactor

const form = document.querySelector("form");
const input = document.querySelector("input");
const button = document.querySelector("button");
const output = document.querySelector(".output");

let fontList = [],
	fonts = "",
	searchResults = [],
	searchQuery = "";

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

const searchFonts = (query) => {
	searchQuery = query.trim();

	if (!searchQuery) {
		return;
	}

	const fuse = new Fuse(fontList, {
		threshold: 0.3,
		keys: ["family"]
	});

	searchResults = [];
	searchResults = fuse
		.search({
			$or: createSearchQuery(searchQuery)
		})
		.map((el) => el.item);
};

const populateResults = (results) => {
	fonts = "";

	results.forEach((res) => {
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

let parsedUrl = new URL(window.location.href);
let urlQuery = parsedUrl.searchParams.get("q");

fetch("https://api.fontsource.org/v1/fonts")
	.then((res) => {
		if (res.ok) return res.json();
		throw new Error("Network response was not ok.");
	})
	.then((data) => {
		fontList = data.slice();
		input.removeAttribute("disabled");
		button.removeAttribute("disabled");

		if (urlQuery) {
			input.value = urlQuery;
			searchFonts(urlQuery);
			populateResults(searchResults);
		}
	})
	.catch((err) => {
		console.log("An error has occured.");
	});

input.addEventListener("keypress", (e) => {});

form.addEventListener("submit", (e) => {
	e.preventDefault();

	// update url parameters with new search query
	parsedUrl = new URLSearchParams(window.location.search);
	parsedUrl.set("q", input.value);
	window.history.pushState({}, "", `?${parsedUrl}`);

	searchFonts(input.value);
	populateResults(searchResults);
});
