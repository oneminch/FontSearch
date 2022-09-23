import Fuse from "fuse.js";
import "virtual:windi.css";
// import "https://fonts.bunny.net/css?family=fraunces:500,600";

// todo update threshold
// todo make efficient

const form = document.querySelector("form");
const input = document.querySelector("input");
const button = document.querySelector("button");
const output = document.querySelector(".output");

let fontList = [],
	fonts = "",
	searchResults = [],
	searchQuery = "";

fetch("https://api.fontsource.org/v1/fonts")
	.then((res) => {
		if (res.ok) return res.json();
		throw new Error("Network response was not ok.");
	})
	.then((data) => {
		fontList = data.slice();
		input.removeAttribute("disabled");
		button.removeAttribute("disabled");
	});

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

const searchFonts = () => {
	searchQuery = input.value.trim();

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
      
				<details class="p-4 border-2 border-blue-gray-700 mb-4 rounded-md">
					<summary class="flex justify-between items-center">
						${res.family}
						<a class="" href="https://fontsource.org/fonts/${res.id}" target="_blank">
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
  							<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
							</svg>
						</a>
					</summary>
					<ul>
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

form.addEventListener("submit", (e) => {
	e.preventDefault();
	searchFonts();
	populateResults(searchResults);
});
