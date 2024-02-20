import Fuse from "fuse.js";
import "virtual:windi.css";

// update readme with unique features of app: fuzzy

// global DOM elements
const form = document.querySelector("form");
const input = document.querySelector("input[type='text']");
const submitButton = document.querySelector("button[type='submit']");
const resetButton = document.querySelector("button[type='reset']");
const categoryDropdown = document.querySelector("select");
const variableCheckbox = document.querySelector("input[type='checkbox']");
const toggleContainer = document.querySelector(".toggle-container");
const output = document.querySelector("#output");

const repoName = "FontSearch";

// global variables
const categories = [
	"sans-serif",
	"serif",
	"monospace",
	"display",
	"handwriting",
	"other"
];

let fullFontList = [],
	filteredFontList = [],
	fonts = "",
	urlParam = "",
	currCategory = "",
	isVariableOnly = false,
	disabledState = true,
	baseUrl = `${window.location.origin}${window.location.pathname}`,
	apiUrl = "https://api.fontsource.org/v1/fonts";

// get default font type for css
const defaultFontFamily = (category) => {
	switch (category) {
		case "handwriting":
			return ", cursive";
			break;
		case "display":
			return ", cursive";
			break;
		case "other":
			return "";
			break;
		default:
			return `, ${category}`;
			break;
	}
};

// Fuse.js specific class to create fuzzy search queries
class Query {
	constructor(name, value) {
		this[name] = value;
	}
}

// creates fuzzy search queries for Fuse instance
const createSearchQuery = (query) => {
	let keywords = query.split(" "),
		queryList = [];

	keywords.forEach((keyword) => {
		queryList.push(new Query("family", keyword));
	});

	return queryList;
};

// get url parameters if any exist
// reset all form controls
const reset = () => {
	input.value = "";
	categoryDropdown.selectedIndex = 0;
	currCategory = categoryDropdown.value;
	variableCheckbox.checked = false;
	isVariableOnly = variableCheckbox.checked;

	let parsedUrl = new URL(window.location.href);
	urlParam = parsedUrl.searchParams.get("q");
	input.value = urlParam ? urlParam : "";
};

// searches fonts and returns results
const searchFonts = (query, list) => {
	const fuse = new Fuse(list, {
		threshold: 0.2,
		keys: ["family"]
	});

	return fuse
		.search({
			$or: createSearchQuery(query)
		})
		.map((el) => el.item);
};

// makes search and populates results
const populateResults = () => {
	let query = input.value,
		category = currCategory,
		variable = isVariableOnly;

	// default empty query
	if (!query || !query.trim()) {
		output.innerHTML = `
			<div class="non-result">
				Press <code>/</code> to focus search box.
			</div>
			`;
		return;
	}

	// filter font list using selected category and variable toggle
	filteredFontList = fullFontList
		.filter((font) => {
			if (variable) {
				return font.variable == variable;
			}
			return true;
		})
		.filter((font) => {
			if (category) {
				return font.category == category;
			}
			return true;
		});

	// load search results
	let searchResults = searchFonts(query, filteredFontList);

	// empty results
	if (searchResults.length === 0) {
		output.innerHTML = `
			<div class="non-result">
				No matches found.
			</div>
			`;
		return;
	}

	// construct & render html of non-empty search results
	fonts = "";
	searchResults.forEach((res) => {
		fonts += `
			<details>
				<summary>
					<div class="result-header">
						<i class="gg-chevron-right"></i>
						<span>${res.family}</span>
						<a
							title="Fontsource Font URL"
							href="https://fontsource.org/fonts/${res.id}"
							target="_blank" rel="noopener noreferrer">
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
					</div>
					<div class="tags">
						<span title="Category">${res.category}</span>
						${res.variable ? "<span>variable</span>" : ""}
						<span title="Version">${res.version}</span>
					</div>
				</summary>
				<code title="Terminal instructions">
					<img src='/${repoName}/cli-icon.svg'>
					npm install @fontsource/${res.id}
				</code>
				<code title="JS entry instructions">
					<img src='/${repoName}/js-icon.svg'>
					import "@fontsource/${res.id}"
				</code>
				<code title="CSS instructions">
					<img src='/${repoName}/css-icon.svg'>
					body { font-family: "${res.family}"${defaultFontFamily(res.category)}; }
				</code>
			</details>
    `;

		output.innerHTML = fonts;
	});
};

// render all font categories as dropdown options
categories.forEach((category) => {
	categoryDropdown.innerHTML += `
		<option value="${category}">
			${category.charAt(0).toUpperCase() + category.slice(1)}
		</option>
	`;
});

// invoke reset on load/reload
reset();

// initial fetch of all fonts from API
fetch(apiUrl)
	.then((res) => {
		if (res.ok) return res.json();
		throw new Error("Network response was not ok.");
	})
	.then((data) => {
		fullFontList = data.slice();
		filteredFontList = fullFontList.slice();

		// make UI accessible after fonts are loaded
		input.removeAttribute("disabled");
		submitButton.removeAttribute("disabled");
		resetButton.removeAttribute("disabled");
		categoryDropdown.removeAttribute("disabled");
		variableCheckbox.removeAttribute("disabled");
		toggleContainer.classList.remove("disabled");
		input.setAttribute("placeholder", "Enter font name");
		disabledState = false;

		// if url has a url parameter, fill input and make search
		if (urlParam) {
			input.value = urlParam;
			populateResults();
		}
	})
	.catch((err) => {
		output.innerHTML = `
			<div
				class="non-result">
				An error has occured when loading the fonts. 
				<br/>
				Please try again in a few seconds.
			</div>
		`;
		input.setAttribute("placeholder", "An error has occured.");
	});

// rerun search on form submission
form.addEventListener("submit", (e) => {
	e.preventDefault();

	// set url query parameter with current search term
	let parsedUrl = new URLSearchParams(window.location.search);
	parsedUrl.set("q", input.value);
	window.history.pushState({}, "", `?${parsedUrl}`);

	// search and populate results on submit
	populateResults();
});

// rerun search on form reset
form.addEventListener("reset", () => {
	window.history.pushState({}, "", baseUrl);
	reset();

	populateResults();
});

// rerun search on category value change
categoryDropdown.addEventListener("change", (e) => {
	currCategory = e.target.value;
	populateResults();
});

// rerun search on variable value change
variableCheckbox.addEventListener("change", (e) => {
	isVariableOnly = e.target.checked;
	populateResults();
});

// reset & rerun search on page navigation: forward and backward
window.addEventListener("popstate", (e) => {
	reset();
	populateResults();
});

// keyboard shortcut listener to focus search box
window.addEventListener("keypress", (e) => {
	if (e.key == "/") {
		e.preventDefault();
	}

	if (e.target.id !== "search-box" && !disabledState) {
		input.focus();
	}
});
