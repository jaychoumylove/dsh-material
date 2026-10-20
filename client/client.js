window.__ModuleLoader__.load({
	id: "dsh-material-theme",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region dsh-material-theme/client/color.js
		/**
		 * Minimal colour maths for a theme plugin: every token is produced from a
		 * small number of palette anchors, so the palette stays coherent instead of
		 * being a 300-line literal table.
		 */
		/** Parse `#rgb` / `#rrggbb` into 0..255 channels. */
		function parse(input) {
			let text = String(input).trim().toLowerCase();
			if (text.startsWith("#")) text = text.slice(1);
			if (text.length === 8) text = text.slice(0, 6);
			if (text.length === 4) text = text.slice(0, 3);
			if (text.length === 3) text = text[0] + text[0] + text[1] + text[1] + text[2] + text[2];
			const value = Number.parseInt(text, 16);
			return {
				r: (value >> 16) & 255,
				g: (value >> 8) & 255,
				b: value & 255
			};
		}
		/** Format 0..255 channels as `#rrggbb`, clamping out-of-range values. */
		function format(channels) {
			let out = "#";
			for (const key of ["r", "g", "b"]) {
				const byte = Math.max(0, Math.min(255, Math.round(channels[key])));
				const part = byte.toString(16);
				out += part.length === 1 ? "0" + part : part;
			}
			return out;
		}
		/** Linear blend: `t = 0` yields `from`, `t = 1` yields `to` (may overshoot). */
		function mix(from, to, t) {
			const a = parse(from);
			const b = parse(to);
			return format({
				r: a.r + (b.r - a.r) * t,
				g: a.g + (b.g - a.g) * t,
				b: a.b + (b.b - a.b) * t
			});
		}
		/** Translucent form of a hex colour. */
		function alpha(input, a) {
			const c = parse(input);
			return "rgba(" + c.r + ", " + c.g + ", " + c.b + ", " + a + ")";
		}
		/** Negative `amount` darkens toward black, positive lightens toward white. */
		function shade(input, amount) {
			return amount < 0 ? mix(input, "#000000", -amount) : mix(input, "#FFFFFF", amount);
		}
		/** WCAG relative luminance, 0..1. */
		function luminance(input) {
			const c = parse(input);
			const channel = (byte) => {
				const v = byte / 255;
				return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
			};
			return 0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b);
		}
		/** WCAG contrast ratio between two opaque colours, 1..21. */
		function contrast(a, b) {
			const la = luminance(a);
			const lb = luminance(b);
			return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
		}
		/** Pick the most legible of the Material dark/light "on" colours. */
		function onColor(background) {
			return contrast("#0B0C10", background) >= contrast("#FFFFFF", background) ? "#0B0C10" : "#FFFFFF";
		}
		//#endregion
		//#region dsh-material-theme/client/palettes.js
/**
 * Official palettes of "Material Design Experience for JetBrains IDEs",
 * https://material-theme.com/docs/reference/color-palette/ — the ten Material
 * palettes plus the other well-known schemes the plugin ships.
 *
 * The values are transcribed from the reference page; `scheme` decides which
 * half of the runtime's light/dark token pairs the palette feeds.
 */
		/** Ordered palettes surfaced in the settings row. */
		const THEMES = [
		{
			id: "oceanic",
			name: "Oceanic",
			zh: "\u6d77\u6d0b",
			group: "material",
			scheme: "dark",
			ui: { bg: "#263238", fg: "#b0bec5", text: "#607d8b", selBg: "#546e7a", selFg: "#ffffff", buttons: "#2e3c43", secondBg: "#32424a", disabled: "#415967", contrast: "#1e272c", active: "#314549", border: "#2a373e", highlight: "#425b67", notif: "#1e272c", accent: "#009688", excluded: "#2e3c43" },
			syntax: { green: "#c3e88d", yellow: "#ffcb6b", blue: "#82aaff", red: "#f07178", purple: "#c792ea", orange: "#f78c6c", cyan: "#89ddff", gray: "#546e7a", white: "#eeffff", error: "#ff5370", comments: "#546e7a", variables: "#eeffff", links: "#80cbc4", functions: "#82aaff", keywords: "#c792ea", tags: "#f07178", strings: "#c3e88d", operators: "#89ddff", attributes: "#ffcb6b", numbers: "#f78c6c", parameters: "#f78c6c" }
		},
		{
			id: "darker",
			name: "Darker",
			zh: "\u6697\u8272",
			group: "material",
			scheme: "dark",
			ui: { bg: "#212121", fg: "#b0bec5", text: "#727272", selBg: "#404040", selFg: "#ffffff", buttons: "#2a2a2a", secondBg: "#292929", disabled: "#474747", contrast: "#1a1a1a", active: "#323232", border: "#292929", highlight: "#3f3f3f", notif: "#1a1a1a", accent: "#ff9800", excluded: "#323232" },
			syntax: { green: "#c3e88d", yellow: "#ffcb6b", blue: "#82aaff", red: "#f07178", purple: "#c792ea", orange: "#f78c6c", cyan: "#89ddff", gray: "#616161", white: "#eeffff", error: "#ff5370", comments: "#616161", variables: "#eeffff", links: "#80cbc4", functions: "#82aaff", keywords: "#c792ea", tags: "#f07178", strings: "#c3e88d", operators: "#89ddff", attributes: "#ffcb6b", numbers: "#f78c6c", parameters: "#f78c6c" }
		},
		{
			id: "lighter",
			name: "Lighter",
			zh: "\u6d45\u8272",
			group: "material",
			scheme: "light",
			ui: { bg: "#fafafa", fg: "#546e7a", text: "#94a7b0", selBg: "#80cbc440", selFg: "#546e7a", buttons: "#f3f4f5", secondBg: "#ffffff", disabled: "#d2d4d5", contrast: "#eeeeee", active: "#e7e7e8", border: "#d3e1e8", highlight: "#e7e7e8", notif: "#eae8e8", accent: "#00bcd4", excluded: "#ccd7da50" },
			syntax: { green: "#91b859", yellow: "#f6a434", blue: "#6182b8", red: "#e53935", purple: "#7c4dff", orange: "#f76d47", cyan: "#39adb5", gray: "#aabfc9", white: "#272727", error: "#e53935", comments: "#aabfc9", variables: "#272727", links: "#39adb5", functions: "#6182b8", keywords: "#7c4dff", tags: "#e53935", strings: "#91b859", operators: "#39adb5", attributes: "#f6a434", numbers: "#f76d47", parameters: "#f76d47" }
		},
		{
			id: "palenight",
			name: "Palenight",
			zh: "\u6d45\u591c",
			group: "material",
			scheme: "dark",
			ui: { bg: "#292d3e", fg: "#a6accd", text: "#676e95", selBg: "#717cb470", selFg: "#ffffff", buttons: "#303348", secondBg: "#34324a", disabled: "#515772", contrast: "#202331", active: "#414863", border: "#2b2a3e", highlight: "#444267", notif: "#202331", accent: "#ab47bc", excluded: "#2f2e43" },
			syntax: { green: "#c3e88d", yellow: "#ffcb6b", blue: "#82aaff", red: "#f07178", purple: "#c792ea", orange: "#f78c6c", cyan: "#89ddff", gray: "#676e95", white: "#eeffff", error: "#ff5370", comments: "#676e95", variables: "#eeffff", links: "#80cbc4", functions: "#82aaff", keywords: "#c792ea", tags: "#f07178", strings: "#c3e88d", operators: "#89ddff", attributes: "#ffcb6b", numbers: "#f78c6c", parameters: "#f78c6c" }
		},
		{
			id: "deep-ocean",
			name: "Deep ocean",
			zh: "\u6df1\u6d77",
			group: "material",
			scheme: "dark",
			ui: { bg: "#0f111a", fg: "#8f93a2", text: "#4b526d", selBg: "#717cb480", selFg: "#ffffff", buttons: "#191a21", secondBg: "#181a1f", disabled: "#464b5d", contrast: "#090b10", active: "#1a1c25", border: "#0f111a", highlight: "#1f2233", notif: "#090b10", accent: "#84ffff", excluded: "#292d3e" },
			syntax: { green: "#c3e88d", yellow: "#ffcb6b", blue: "#82aaff", red: "#f07178", purple: "#c792ea", orange: "#f78c6c", cyan: "#89ddff", gray: "#717cb4", white: "#eeffff", error: "#ff5370", comments: "#717cb4", variables: "#eeffff", links: "#80cbc4", functions: "#82aaff", keywords: "#c792ea", tags: "#f07178", strings: "#c3e88d", operators: "#89ddff", attributes: "#ffcb6b", numbers: "#f78c6c", parameters: "#f78c6c" }
		},
		{
			id: "forest",
			name: "Forest",
			zh: "\u68ee\u6797",
			group: "material",
			scheme: "dark",
			ui: { bg: "#002626", fg: "#b2c2b0", text: "#49694d", selBg: "#1e611e", selFg: "#ffffff", buttons: "#003535", secondBg: "#002e2e", disabled: "#005454", contrast: "#002020", active: "#104110", border: "#003838", highlight: "#003f3f", notif: "#002020", accent: "#ffcc80", excluded: "#113711" },
			syntax: { green: "#c3e88d", yellow: "#ffcb6b", blue: "#82aaff", red: "#f07178", purple: "#c792ea", orange: "#f78c6c", cyan: "#89ddff", gray: "#005454", white: "#eeffff", error: "#ff5370", comments: "#005454", variables: "#eeffff", links: "#80cbc4", functions: "#82aaff", keywords: "#c792ea", tags: "#f07178", strings: "#c3e88d", operators: "#89ddff", attributes: "#ffcb6b", numbers: "#f78c6c", parameters: "#f78c6c" }
		},
		{
			id: "sky-blue",
			name: "Sky blue",
			zh: "\u5929\u7a7a\u84dd",
			group: "material",
			scheme: "light",
			ui: { bg: "#f5f5f5", fg: "#005761", text: "#01579b", selBg: "#ade2eb", selFg: "#ffffff", buttons: "#c9eef2", secondBg: "#e7f2f3", disabled: "#e7f2f3", contrast: "#e4f2f2", active: "#caedf2", border: "#d0edf1", highlight: "#d1eafa", notif: "#e0eff1", accent: "#00c6e0", excluded: "#c1def0" },
			syntax: { green: "#91b859", yellow: "#f6a434", blue: "#6182b8", red: "#e53935", purple: "#7c4dff", orange: "#f76d47", cyan: "#39adb5", gray: "#01579b", white: "#272727", error: "#e53935", comments: "#01579b", variables: "#272727", links: "#39adb5", functions: "#6182b8", keywords: "#7c4dff", tags: "#e53935", strings: "#91b859", operators: "#39adb5", attributes: "#f6a434", numbers: "#f76d47", parameters: "#f76d47" }
		},
		{
			id: "sandy-beach",
			name: "Sandy beach",
			zh: "\u6c99\u6ee9",
			group: "material",
			scheme: "light",
			ui: { bg: "#fff8ed", fg: "#546e7a", text: "#888477", selBg: "#e7c496", selFg: "#ffffff", buttons: "#f6d7b0", secondBg: "#f6edda", disabled: "#b8b6a5", contrast: "#fff3db", active: "#fef8ec", border: "#f2edde", highlight: "#fbf1df", notif: "#f6d7b0", accent: "#53c7f0", excluded: "#f2e7ca" },
			syntax: { green: "#91b859", yellow: "#f6a434", blue: "#6182b8", red: "#e53935", purple: "#7c4dff", orange: "#f76d47", cyan: "#39adb5", gray: "#888477", white: "#272727", error: "#e53935", comments: "#888477", variables: "#272727", links: "#39adb5", functions: "#6182b8", keywords: "#7c4dff", tags: "#e53935", strings: "#91b859", operators: "#39adb5", attributes: "#f6a434", numbers: "#f76d47", parameters: "#f76d47" }
		},
		{
			id: "volcano",
			name: "Volcano",
			zh: "\u706b\u5c71",
			group: "material",
			scheme: "dark",
			ui: { bg: "#390000", fg: "#ffeaea", text: "#ffd0aa", selBg: "#750000", selFg: "#ffffff", buttons: "#700000", secondBg: "#330000", disabled: "#7f3c3c", contrast: "#300000", active: "#440000", border: "#400000", highlight: "#550000", notif: "#300a0a", accent: "#00bcd4", excluded: "#662222" },
			syntax: { green: "#c3e88d", yellow: "#ffcb6b", blue: "#82aaff", red: "#f07178", purple: "#c792ea", orange: "#f78c6c", cyan: "#89ddff", gray: "#7f6451", white: "#eeffff", error: "#ff5370", comments: "#7f6451", variables: "#eeffff", links: "#80cbc4", functions: "#82aaff", keywords: "#c792ea", tags: "#f07178", strings: "#c3e88d", operators: "#89ddff", attributes: "#ffcb6b", numbers: "#f78c6c", parameters: "#f78c6c" }
		},
		{
			id: "space",
			name: "Space",
			zh: "\u592a\u7a7a",
			group: "material",
			scheme: "dark",
			ui: { bg: "#1b2240", fg: "#efeff1", text: "#959daa", selBg: "#383f56", selFg: "#ffffff", buttons: "#313852", secondBg: "#292f4d", disabled: "#5a6270", contrast: "#060f2f", active: "#303c6a", border: "#313852", highlight: "#383f56", notif: "#080f30", accent: "#ad9bf6", excluded: "#2f1d76" },
			syntax: { green: "#c3e88d", yellow: "#ffcb6b", blue: "#82aaff", red: "#f07178", purple: "#c792ea", orange: "#f78c6c", cyan: "#89ddff", gray: "#959daa", white: "#eeffff", error: "#ff5370", comments: "#959daa", variables: "#eeffff", links: "#80cbc4", functions: "#82aaff", keywords: "#c792ea", tags: "#f07178", strings: "#c3e88d", operators: "#89ddff", attributes: "#ffcb6b", numbers: "#f78c6c", parameters: "#f78c6c" }
		},
		{
			id: "monokai-pro",
			name: "Monokai pro",
			zh: "Monokai Pro",
			group: "other",
			scheme: "dark",
			ui: { bg: "#2d2a2e", fg: "#fcfcfa", text: "#939293", selBg: "#6e6c6f", selFg: "#ffffff", buttons: "#403e41", secondBg: "#403e41", disabled: "#5b595c", contrast: "#221f22", active: "#4a474b", border: "#2d2a2e", highlight: "#5b595c", notif: "#363437", accent: "#ffd866", excluded: "#3a3a3c" },
			syntax: { green: "#a9dc76", yellow: "#ffd866", blue: "#78dce8", red: "#ff6188", purple: "#ab9df2", orange: "#f59762", cyan: "#78dce8", gray: "#727072", white: "#fcfcfa", error: "#f65f87", comments: "#727072", variables: "#fcfcfa", links: "#78dce8", functions: "#a9dc76", keywords: "#ff6188", tags: "#ff6188", strings: "#ffd866", operators: "#ff6188", attributes: "#78dce8", numbers: "#ab9df2", parameters: "#f59762" }
		},
		{
			id: "dracula",
			name: "Dracula",
			zh: "\u5fb7\u53e4\u62c9",
			group: "other",
			scheme: "dark",
			ui: { bg: "#282a36", fg: "#f8f8f2", text: "#6272a4", selBg: "#44475a", selFg: "#8be9fd", buttons: "#393c4b", secondBg: "#282a36", disabled: "#6272a4", contrast: "#191a21", active: "#44475a", border: "#21222c", highlight: "#6272a4", notif: "#1d2228", accent: "#ff79c5", excluded: "#313341" },
			syntax: { green: "#8aff80", yellow: "#feff80", blue: "#79cbdc", red: "#f780bf", purple: "#9580ff", orange: "#f89580", cyan: "#80ffea", gray: "#6272a4", white: "#f8f8f2", error: "#ff5555", comments: "#6272a4", variables: "#f8f8f2", links: "#feff80", functions: "#8aff80", keywords: "#f780bf", tags: "#f780bf", strings: "#feff80", operators: "#f780bf", attributes: "#8aff80", numbers: "#9580ff", parameters: "#f89580" }
		},
		{
			id: "github",
			name: "Github",
			zh: "GitHub",
			group: "other",
			scheme: "light",
			ui: { bg: "#f7f8fa", fg: "#5b6168", text: "#292d31", selBg: "#3a66d150", selFg: "#ffffff", buttons: "#edf1f5", secondBg: "#f3f3f3", disabled: "#9ba0a3", contrast: "#fafbfc", active: "#cce5ff", border: "#dfe1e4", highlight: "#cce5ff", notif: "#dfecfe", accent: "#79cb60", excluded: "#dcdcdc" },
			syntax: { green: "#22863a", yellow: "#e36209", blue: "#005cc5", red: "#d73a49", purple: "#6f42c1", orange: "#e36209", cyan: "#032f62", gray: "#6a737d", white: "#24292e", error: "#d25252", comments: "#6a737d", variables: "#24292e", links: "#005cc5", functions: "#6f42c1", keywords: "#d73a49", tags: "#22863a", strings: "#032f62", operators: "#d73a49", attributes: "#6f42c1", numbers: "#005cc5", parameters: "#e36209" }
		},
		{
			id: "github-dark",
			name: "Github dark",
			zh: "GitHub \u6697\u8272",
			group: "other",
			scheme: "dark",
			ui: { bg: "#24292e", fg: "#e1e4e8", text: "#959da5", selBg: "#3392ff44", selFg: "#ffffff", buttons: "#39414a", secondBg: "#2f363d", disabled: "#6a737d", contrast: "#1e2428", active: "#2b3036", border: "#1b1f23", highlight: "#444d56", notif: "#2f363d", accent: "#f9826c", excluded: "#2f363d" },
			syntax: { green: "#85e89d", yellow: "#ffab70", blue: "#79b8ff", red: "#f97583", purple: "#b392f0", orange: "#ffab70", cyan: "#79b8ff", gray: "#959da5", white: "#d1d5da", error: "#f97583", comments: "#959da5", variables: "#d1d5da", links: "#79b8ff", functions: "#b392f0", keywords: "#f97583", tags: "#85e89d", strings: "#79b8ff", operators: "#f97583", attributes: "#b392f0", numbers: "#79b8ff", parameters: "#ffab70" }
		},
		{
			id: "arc-dark",
			name: "Arc dark",
			zh: "Arc \u6697\u8272",
			group: "other",
			scheme: "dark",
			ui: { bg: "#2f343f", fg: "#d3dae3", text: "#8b9eb5", selBg: "#8888ff55", selFg: "#ffffff", buttons: "#383c4a", secondBg: "#393f4c45", disabled: "#d3dae3", contrast: "#262b33", active: "#41416a", border: "#404552", highlight: "#393f4c", notif: "#262a33", accent: "#42a5f5", excluded: "#37373d" },
			syntax: { green: "#8f9d6a", yellow: "#f9ee98", blue: "#7587a6", red: "#cf6a4c", purple: "#9b859d", orange: "#cda869", cyan: "#47bc9b", gray: "#a7a7a7", white: "#d3dae3", error: "#cf6a4c", comments: "#747c84", variables: "#cf6a4c", links: "#7587a6", functions: "#7587a6", keywords: "#9b859d", tags: "#cf6a4c", strings: "#8f9d6a", operators: "#a7a7a7", attributes: "#f9ee98", numbers: "#cda869", parameters: "#cda869" }
		},
		{
			id: "one-dark",
			name: "One dark",
			zh: "One \u6697\u8272",
			group: "other",
			scheme: "dark",
			ui: { bg: "#282c34", fg: "#979fad", text: "#979fad", selBg: "#4d515d", selFg: "#ffffff", buttons: "#3a3f4b", secondBg: "#2f333d", disabled: "#6b727d", contrast: "#21252b", active: "#383e49", border: "#282c34", highlight: "#383d48", notif: "#282c34", accent: "#2979ff", excluded: "#3c4150" },
			syntax: { green: "#98c379", yellow: "#e5c17c", blue: "#61aeef", red: "#e06c75", purple: "#c679dd", orange: "#d19a66", cyan: "#57b6c2", gray: "#59626f", white: "#abb2bf", error: "#e06c75", comments: "#59626f", variables: "#d19a66", links: "#56b6c2", functions: "#61aeef", keywords: "#c679dd", tags: "#e06c75", strings: "#98c379", operators: "#61afef", attributes: "#e5c17c", numbers: "#d19a66", parameters: "#abb2bf" }
		},
		{
			id: "one-light",
			name: "One light",
			zh: "One \u6d45\u8272",
			group: "other",
			scheme: "light",
			ui: { bg: "#f4f4f4", fg: "#232324", text: "#7f7f7f", selBg: "#ffffff", selFg: "#232324", buttons: "#dbdbdc", secondBg: "#eaeaeb", disabled: "#b8b8b9", contrast: "#eaeaea", active: "#dbdbdc", border: "#dbdbdc", highlight: "#ffffff", notif: "#f2f2f2", accent: "#2979ff", excluded: "#cacacb" },
			syntax: { green: "#50a14e", yellow: "#c18401", blue: "#4078f2", red: "#e4564a", purple: "#a626a4", orange: "#986801", cyan: "#0184bc", gray: "#a0a1a7", white: "#232324", error: "#e4564a", comments: "#a0a1a7", variables: "#986801", links: "#0184bc", functions: "#4078f2", keywords: "#a626a4", tags: "#e4564a", strings: "#50a14e", operators: "#4078f2", attributes: "#c18401", numbers: "#986801", parameters: "#383a42" }
		},
		{
			id: "solarized-dark",
			name: "Solarized dark",
			zh: "\u65e5\u5149\u6697\u8272",
			group: "other",
			scheme: "dark",
			ui: { bg: "#002b36", fg: "#839496", text: "#586e75", selBg: "#2e4c52", selFg: "#ffffff", buttons: "#073642", secondBg: "#003745", disabled: "#2e5861", contrast: "#00252e", active: "#003946", border: "#0d3640", highlight: "#005a6f", notif: "#2e4c52", accent: "#d33682", excluded: "#083f4d" },
			syntax: { green: "#859900", yellow: "#b58900", blue: "#268bd2", red: "#d13684", purple: "#6c71c4", orange: "#cb4b16", cyan: "#2aa198", gray: "#657b83", white: "#93a1a1", error: "#dc322f", comments: "#657b83", variables: "#268bd2", links: "#268bd2", functions: "#b58900", keywords: "#859900", tags: "#268bd2", strings: "#2aa198", operators: "#93a1a1", attributes: "#b58900", numbers: "#d33682", parameters: "#93a1a1" }
		},
		{
			id: "solarized-light",
			name: "Solarized light",
			zh: "\u65e5\u5149\u6d45\u8272",
			group: "other",
			scheme: "light",
			ui: { bg: "#fdf6e3", fg: "#586e75", text: "#93a1a1", selBg: "#e8dcb6", selFg: "#002b36", buttons: "#d8d4c4", secondBg: "#f6f0de", disabled: "#c9ccc3", contrast: "#eee8d5", active: "#d1cbb8", border: "#edead9", highlight: "#d1cbb8", notif: "#ede8d4", accent: "#d33682", excluded: "#e3dcc9" },
			syntax: { green: "#859900", yellow: "#b58900", blue: "#268bd2", red: "#d13684", purple: "#6c71c4", orange: "#cb4b16", cyan: "#2aa198", gray: "#93a1a1", white: "#657b83", error: "#dc322f", comments: "#93a1a1", variables: "#268bd2", links: "#268bd2", functions: "#b58900", keywords: "#859900", tags: "#268bd2", strings: "#2aa198", operators: "#657b83", attributes: "#657b83", numbers: "#d33682", parameters: "#657b83" }
		},
		{
			id: "night-owl",
			name: "Night owl",
			zh: "\u591c\u732b\u5934\u9e70",
			group: "other",
			scheme: "dark",
			ui: { bg: "#011627", fg: "#d6deeb", text: "#5f7e97", selBg: "#5f7e9790", selFg: "#ffffff", buttons: "#0b253a", secondBg: "#0b2942", disabled: "#697098", contrast: "#010e1a", active: "#13344f", border: "#122d42", highlight: "#084d81", notif: "#01111d", accent: "#7e57c2", excluded: "#0e293f" },
			syntax: { green: "#addb67", yellow: "#ecc48d", blue: "#82aaff", red: "#ff6363", purple: "#c792ea", orange: "#f78c6c", cyan: "#7fdbca", gray: "#637777", white: "#d6deeb", error: "#ef5350", comments: "#637777", variables: "#addb67", links: "#ecc48d", functions: "#82aaff", keywords: "#c792ea", tags: "#7fdbca", strings: "#ecc48d", operators: "#c792ea", attributes: "#addb67", numbers: "#f78c6c", parameters: "#d6deeb" }
		},
		{
			id: "light-owl",
			name: "Light owl",
			zh: "\u767d\u732b\u5934\u9e70",
			group: "other",
			scheme: "light",
			ui: { bg: "#f0f0f0", fg: "#403f53", text: "#90a7b2", selBg: "#d3e8f8", selFg: "#403f53", buttons: "#d9d9d9", secondBg: "#fbfbfb", disabled: "#93a1a1", contrast: "#f0f0f0", active: "#d3e8f8", border: "#d9d9d9", highlight: "#cccccc", notif: "#f0f0f0", accent: "#2aa298", excluded: "#e0e7ea" },
			syntax: { green: "#56b6c2", yellow: "#e0af02", blue: "#4876d6", red: "#aa0982", purple: "#994cc3", orange: "#c96765", cyan: "#0c969b", gray: "#989fb1", white: "#111111", error: "#de3d3b", comments: "#989fb1", variables: "#4876d6", links: "#ff869a", functions: "#4876d6", keywords: "#994cc3", tags: "#994cc3", strings: "#c96765", operators: "#994cc3", attributes: "#0c969b", numbers: "#aa0982", parameters: "#0c969b" }
		},
		{
			id: "moonlight",
			name: "Moonlight",
			zh: "\u6708\u5149",
			group: "other",
			scheme: "dark",
			ui: { bg: "#222436", fg: "#c8d3f5", text: "#a9b8e8", selBg: "#444a73", selFg: "#ffffff", buttons: "#444a73", secondBg: "#2f334d", disabled: "#828bb8", contrast: "#191a2a", active: "#2f334d", border: "#222436", highlight: "#444a73", notif: "#191a2a", accent: "#74a0f1", excluded: "#2f334d" },
			syntax: { green: "#7af8ca", yellow: "#ffdb8e", blue: "#70b0ff", red: "#f3c1ff", purple: "#baacff", orange: "#ff9668", cyan: "#34d3fb", gray: "#7e8eda", white: "#c8d3f5", error: "#ff5370", comments: "#7e8eda", variables: "#c8d3f5", links: "#34d3fb", functions: "#70b0ff", keywords: "#baacff", tags: "#ff757f", strings: "#7af8ca", operators: "#baacff", attributes: "#ffbd76", numbers: "#ff9668", parameters: "#f3c1ff" }
		},
		{
			id: "synthwave-84",
			name: "Synthwave '84",
			zh: "\u5408\u6210\u6ce2 84",
			group: "other",
			scheme: "dark",
			ui: { bg: "#2a2139", fg: "#ffffff", text: "#999999", selBg: "#463465", selFg: "#ffffff", buttons: "#382c4d", secondBg: "#2a2139", disabled: "#848bbd", contrast: "#241b2f", active: "#34294f", border: "#34294f", highlight: "#463564", notif: "#191621", accent: "#f92aad", excluded: "#463564" },
			syntax: { green: "#72f1b8", yellow: "#fede5d", blue: "#34d3fb", red: "#fe4450", purple: "#ff7edb", orange: "#f97e72", cyan: "#36f9f6", gray: "#848bbd", white: "#b6b1b1", error: "#fe4450", comments: "#848bbd", variables: "#b6b1b1", links: "#ff7edb", functions: "#36f9f6", keywords: "#fede5d", tags: "#72f1b8", strings: "#ff8b39", operators: "#fede5d", attributes: "#fede5d", numbers: "#f97e72", parameters: "#ff7edb" }
		},
		{
			id: "cobalt2",
			name: "Cobalt2",
			zh: "\u94b4\u84dd 2",
			group: "other",
			scheme: "dark",
			ui: { bg: "#193549", fg: "#e1efff", text: "#6a879c", selBg: "#234e6d", selFg: "#ffffff", buttons: "#173042", secondBg: "#122738", disabled: "#6a879c", contrast: "#0d3a58", active: "#122738", border: "#0d3a58", highlight: "#1f4662", notif: "#003f5e", accent: "#ffc600", excluded: "#173042" },
			syntax: { green: "#3ad900", yellow: "#ffc600", blue: "#0088ff", red: "#ff628c", purple: "#fb94ff", orange: "#ff9d00", cyan: "#fb94ff", gray: "#6a879c", white: "#e1efff", error: "#ff628c", comments: "#0088ff", variables: "#e1efff", links: "#6fbeff", functions: "#ffc600", keywords: "#ff9d00", tags: "#ff628c", strings: "#3ad900", operators: "#ff9d00", attributes: "#ffc600", numbers: "#ff628c", parameters: "#ffc600" }
		},
		{
			id: "prism",
			name: "Prism",
			zh: "\u68f1\u955c",
			group: "other",
			scheme: "dark",
			ui: { bg: "#0f111a", fg: "#a6accd", text: "#464b5d", selBg: "#717cb425", selFg: "#ffffff", buttons: "#131520", secondBg: "#0f111a", disabled: "#464b5d", contrast: "#1a1c29", active: "#131520", border: "#1a1c29", highlight: "#191c29", notif: "#1a1c29", accent: "#a277ff", excluded: "#131520" },
			syntax: { green: "#61ffca", yellow: "#ffca85", blue: "#82e2ff", red: "#ff6767", purple: "#b774dc", orange: "#ffca85", cyan: "#82e2ff", gray: "#464b5d", white: "#a6accd", error: "#ff5370", comments: "#464b5d", variables: "#a6accd", links: "#82e2ff", functions: "#a277ff", keywords: "#a277ff", tags: "#ff6767", strings: "#61ffca", operators: "#a277ff", attributes: "#a277ff", numbers: "#ffca85", parameters: "#a277ff" }
		},
		{
			id: "prism-light",
			name: "Prism light",
			zh: "\u68f1\u955c\u6d45\u8272",
			group: "other",
			scheme: "light",
			ui: { bg: "#fafafa", fg: "#29263c", text: "#9d9d9d", selBg: "#6366f120", selFg: "#29263c", buttons: "#f1f5f9", secondBg: "#fafafa", disabled: "#f1f5f9", contrast: "#e2e8f0", active: "#f1f5f9", border: "#e2e8f0", highlight: "#e2e8f0", notif: "#e2e8f0", accent: "#6366f1", excluded: "#f1f5f9" },
			syntax: { green: "#00a67e", yellow: "#f59e0b", blue: "#2196f3", red: "#d7263d", purple: "#8931b9", orange: "#f59e0b", cyan: "#2196f3", gray: "#9d9d9d", white: "#29263c", error: "#d7263d", comments: "#9d9d9d", variables: "#29263c", links: "#2196f3", functions: "#6366f1", keywords: "#6366f1", tags: "#d7263d", strings: "#00a67e", operators: "#6366f1", attributes: "#6366f1", numbers: "#f59e0b", parameters: "#6366f1" }
		},
		{
			id: "horizon",
			name: "Horizon",
			zh: "\u5730\u5e73\u7ebf",
			group: "other",
			scheme: "dark",
			ui: { bg: "#1c1e26", fg: "#d5d8da", text: "#424557", selBg: "#7d81a3", selFg: "#ffffff", buttons: "#424557", secondBg: "#1c1e26", disabled: "#424557", contrast: "#2e303e", active: "#424557", border: "#2e303e", highlight: "#2e303e", notif: "#2e303e", accent: "#fe5e78", excluded: "#424557" },
			syntax: { green: "#99d279", yellow: "#f8d28a", blue: "#21b1be", red: "#f6637c", purple: "#b774dc", orange: "#f8d28a", cyan: "#21b1be", gray: "#424557", white: "#d5d8da", error: "#f6637c", comments: "#424557", variables: "#d5d8da", links: "#21b1be", functions: "#fe5e78", keywords: "#fe5e78", tags: "#f6637c", strings: "#99d279", operators: "#fe5e78", attributes: "#fe5e78", numbers: "#f8d28a", parameters: "#fe5e78" }
		},
		{
			id: "horizon-bright",
			name: "Horizon bright",
			zh: "\u5730\u5e73\u7ebf\u660e\u4eae",
			group: "other",
			scheme: "light",
			ui: { bg: "#fdf0ed", fg: "#16161c", text: "#af5427", selBg: "#f9cbbe", selFg: "#16161c", buttons: "#f9cec3", secondBg: "#fdf0ed", disabled: "#f9cec3", contrast: "#fadad1", active: "#f9cec3", border: "#f9cbbe", highlight: "#f9cbbe", notif: "#fadad1", accent: "#e84a72", excluded: "#f9cec3" },
			syntax: { green: "#07da8c", yellow: "#f77d26", blue: "#1eaeae", red: "#e73665", purple: "#8931b9", orange: "#f77d26", cyan: "#1eaeae", gray: "#af5427", white: "#16161c", error: "#e73665", comments: "#af5427", variables: "#16161c", links: "#1eaeae", functions: "#e84a72", keywords: "#e84a72", tags: "#e73665", strings: "#07da8c", operators: "#e84a72", attributes: "#e84a72", numbers: "#f77d26", parameters: "#e84a72" }
		},
		{
			id: "omni",
			name: "Omni",
			zh: "\u5168\u8272",
			group: "other",
			scheme: "dark",
			ui: { bg: "#191622", fg: "#e1e1e6", text: "#5a4b81", selBg: "#41414d", selFg: "#ffffff", buttons: "#15121e", secondBg: "#191622", disabled: "#15121e", contrast: "#15121e", active: "#15121e", border: "#15121e", highlight: "#15121e", notif: "#13111b", accent: "#988bc7", excluded: "#15121e" },
			syntax: { green: "#67e480", yellow: "#e7de79", blue: "#78d1e1", red: "#e96379", purple: "#988bc7", orange: "#e7de79", cyan: "#78d1e1", gray: "#5a4b81", white: "#e1e1e6", error: "#e96379", comments: "#5a4b81", variables: "#e1e1e6", links: "#78d1e1", functions: "#988bc7", keywords: "#988bc7", tags: "#e96379", strings: "#67e480", operators: "#988bc7", attributes: "#988bc7", numbers: "#e7de79", parameters: "#988bc7" }
		},
		{
			id: "noctis",
			name: "Noctis",
			zh: "\u8bfa\u514b\u63d0\u65af",
			group: "other",
			scheme: "dark",
			ui: { bg: "#052529", fg: "#b2cacd", text: "#a5b5b5", selBg: "#0e6671", selFg: "#ffffff", buttons: "#073940", secondBg: "#073940", disabled: "#47686c", contrast: "#041d20", active: "#062d32", border: "#073940", highlight: "#0e6671", notif: "#073940", accent: "#40d4e7", excluded: "#062d32" },
			syntax: { green: "#49e9a6", yellow: "#49d6e9", blue: "#16a3b6", red: "#e66533", purple: "#df769b", orange: "#e4b781", cyan: "#40d4e7", gray: "#5b858b", white: "#b2cacd", error: "#e34e1c", comments: "#5b858b", variables: "#e4b781", links: "#49d6e9", functions: "#16a3b6", keywords: "#df769b", tags: "#e66533", strings: "#49e9a6", operators: "#df769b", attributes: "#49d6e9", numbers: "#7060eb", parameters: "#e4b781" }
		},
		{
			id: "winter-is-coming",
			name: "Winter is coming",
			zh: "\u51db\u51ac\u5c06\u81f3",
			group: "other",
			scheme: "dark",
			ui: { bg: "#011627", fg: "#a7dbf7", text: "#7799bb", selBg: "#103362", selFg: "#ffffff", buttons: "#0e2637", secondBg: "#0e293f", disabled: "#496b81", contrast: "#000d1d", active: "#1b3548", border: "#2b2f40", highlight: "#03648a", notif: "#011627", accent: "#219fd5", excluded: "#0b253a" },
			syntax: { green: "#bcf0c0", yellow: "#f7ecb5", blue: "#87aff4", red: "#6dbdfa", purple: "#d29ffc", orange: "#f7ecb5", cyan: "#00bff9", gray: "#999999", white: "#a7dbf7", error: "#ef5350", comments: "#999999", variables: "#d6deeb", links: "#0bc2f6", functions: "#87aff4", keywords: "#00bff9", tags: "#6dbdfa", strings: "#bcf0c0", operators: "#00bff9", attributes: "#f7ecb5", numbers: "#8dec95", parameters: "#d7dbe0" }
		},
		{
			id: "shades-of-purple",
			name: "Shades of purple",
			zh: "\u7d2b\u5f71",
			group: "other",
			scheme: "dark",
			ui: { bg: "#222244", fg: "#e1efff", text: "#a599e9", selBg: "#5e6184", selFg: "#f4ffff", buttons: "#3b3a62", secondBg: "#37365e", disabled: "#747898", contrast: "#1e1e3f", active: "#494a70", border: "#313059", highlight: "#525378", notif: "#222244", accent: "#fad000", excluded: "#3d3c64" },
			syntax: { green: "#a5ff90", yellow: "#fad000", blue: "#9effff", red: "#ff628c", purple: "#b362ff", orange: "#ff9d00", cyan: "#9effff", gray: "#747898", white: "#e1efff", error: "#ec3a37", comments: "#b362ff", variables: "#e1efff", links: "#faa309", functions: "#fad000", keywords: "#ff9d00", tags: "#9effff", strings: "#a5ff90", operators: "#ff9d00", attributes: "#fad000", numbers: "#ff628c", parameters: "#e1efff" }
		}
		];
		/** Accent colours of the IDE plugin (MTAccents, MIT). `auto` follows the palette. */
/**
 * The reference page encodes a few roles as #rrggbbaa (Selection Background,
 * Tree …). DSH surfaces need solid colours, so every palette value is
 * normalized to an opaque hex once, here.
 */
for (const theme of THEMES) {
	for (const key of Object.keys(theme.ui)) theme.ui[key] = format(parse(theme.ui[key]));
	for (const key of Object.keys(theme.syntax)) theme.syntax[key] = format(parse(theme.syntax[key]));
}
		/** Official accent table (MTAccents) plus the "follow the palette" entry. */
		/** Short display names: every palette is written in 3-4 Chinese characters. */
const ZH_NAMES = {
	oceanic: "海洋蓝",
	darker: "暗灰调",
	lighter: "浅亮白",
	palenight: "浅夜紫",
	"deep-ocean": "深海蓝",
	forest: "深林绿",
	"sky-blue": "天空蓝",
	"sandy-beach": "暖沙色",
	volcano: "火山红",
	space: "深空蓝",
	"monokai-pro": "暖灰暗",
	dracula: "德古拉",
	github: "极简白",
	"github-dark": "极简暗",
	"arc-dark": "蓝灰暗",
	"one-dark": "炭灰蓝",
	"one-light": "纯白浅",
	"solarized-dark": "日光暗",
	"solarized-light": "日光浅",
	"night-owl": "夜猫头鹰",
	"light-owl": "白猫头鹰",
	moonlight: "月色蓝",
	"synthwave-84": "合成波",
	cobalt2: "钴蓝调",
	prism: "棱镜暗",
	"prism-light": "棱镜浅",
	horizon: "地平线",
	"horizon-bright": "地平光",
	omni: "全色暗",
	noctis: "静夜蓝",
	"winter-is-coming": "凛冬蓝",
	"shades-of-purple": "紫影调",
};
for (const theme of THEMES) {
	if (ZH_NAMES[theme.id]) theme.zh = ZH_NAMES[theme.id];
}
const ACCENTS = [
		{
			id: "auto",
			label: "Official",
			zh: "\u8ddf\u968f\u4e3b\u9898",
			value: null
		},
		{
			id: "acid-lime",
			label: "Acid lime",
			zh: "\u9178\u6a59",
			value: "#c6ff00"
		},
		{
			id: "amethyst",
			label: "Amethyst",
			zh: "\u7d2b\u6c34\u6676",
			value: "#ab47bc"
		},
		{
			id: "amber",
			label: "Amber",
			zh: "\u7425\u73c0",
			value: "#ffc107"
		},
		{
			id: "aquamarine",
			label: "Aquamarine",
			zh: "\u6d77\u84dd\u5b9d\u77f3",
			value: "#64ffda"
		},
		{
			id: "abyss",
			label: "Abyss",
			zh: "\u6df1\u6e0a",
			value: "#0f111a"
		},
		{
			id: "breaking-bad",
			label: "Breaking bad",
			zh: "\u6bd2\u7eff",
			value: "#388e3c"
		},
		{
			id: "brick",
			label: "Brick",
			zh: "\u7816\u7ea2",
			value: "#e57373"
		},
		{
			id: "carbon",
			label: "Carbon",
			zh: "\u78b3\u9ed1",
			value: "#424242"
		},
		{
			id: "coffee",
			label: "Coffee",
			zh: "\u5496\u5561",
			value: "#795548"
		},
		{
			id: "cyan",
			label: "Cyan",
			zh: "\u9752\u8272",
			value: "#00bcd4"
		},
		{
			id: "daisy",
			label: "Daisy",
			zh: "\u96cf\u83ca",
			value: "#ffeb3b"
		},
		{
			id: "dodger-blue",
			label: "Dodgerblue",
			zh: "\u9053\u5947\u84dd",
			value: "#2979ff"
		},
		{
			id: "fuchsia",
			label: "Fuchsia",
			zh: "\u7d2b\u7ea2",
			value: "#e91e63"
		},
		{
			id: "graphite",
			label: "Graphite",
			zh: "\u77f3\u58a8",
			value: "#616161"
		},
		{
			id: "indigo",
			label: "Indigo",
			zh: "\u975b\u84dd",
			value: "#3f51b5"
		},
		{
			id: "lavender",
			label: "Lavender",
			zh: "\u85b0\u8863\u8349",
			value: "#7e57c2"
		},
		{
			id: "light",
			label: "Light",
			zh: "\u4eae\u767d",
			value: "#fafafa"
		},
		{
			id: "lime",
			label: "Lime",
			zh: "\u9752\u67e0",
			value: "#7cb342"
		},
		{
			id: "neon",
			label: "Neon",
			zh: "\u9713\u8679",
			value: "#1de9b6"
		},
		{
			id: "oceanic",
			label: "Oceanic",
			zh: "\u6d77\u6d0b",
			value: "#546e7a"
		},
		{
			id: "orange",
			label: "Orange",
			zh: "\u6a59\u8272",
			value: "#ff9800"
		},
		{
			id: "palenight",
			label: "Palenight",
			zh: "\u6d45\u591c\u7d2b",
			value: "#676e95"
		},
		{
			id: "plant",
			label: "Plant",
			zh: "\u690d\u7269\u7eff",
			value: "#81c784"
		},
		{
			id: "pomegranate",
			label: "Pomegranate",
			zh: "\u77f3\u69b4\u7ea2",
			value: "#b71c1c"
		},
		{
			id: "silver",
			label: "Silver",
			zh: "\u94f6\u7070",
			value: "#9e9e9e"
		},
		{
			id: "sky",
			label: "Sky",
			zh: "\u5929\u84dd",
			value: "#84ffff"
		},
		{
			id: "slate",
			label: "Slate",
			zh: "\u677f\u5ca9",
			value: "#607d8b"
		},
		{
			id: "strawberry",
			label: "Strawberry",
			zh: "\u8349\u8393",
			value: "#ff4081"
		},
		{
			id: "teal",
			label: "Teal",
			zh: "\u9752\u7eff",
			value: "#009688"
		},
		{
			id: "tomato",
			label: "Tomato",
			zh: "\u756a\u8304",
			value: "#f44336"
		},
		{
			id: "turquoise",
			label: "Turquoise",
			zh: "\u7eff\u677e\u77f3",
			value: "#80cbc4"
		},
		{
			id: "water",
			label: "Water",
			zh: "\u6c34\u84dd",
			value: "#42a5f5"
		},
		{
			id: "atomic-purple",
			label: "Atomic purple",
			zh: "\u539f\u5b50\u7d2b",
			value: "#651fff"
		}
		];
//#endregion
//#region dsh-material-theme/client/tokens.js
/**
 * Token builder: every `--dsw-*` value is derived from one official palette plus
 * one accent colour. Results are `{ light, dark }` records because the runtime's
 * token layer requires both halves.
 */
/** Ramp step names shipped by the built-in theme, per family. */
const BLUISH_STEPS = [
	"00", "50", "60", "75", "100", "150", "200", "300", "400", "500", "600",
	"700", "750", "800", "850", "875", "900", "950", "1000"
];
const NEUTRAL_STEPS = [
	"00", "50", "100", "150", "200", "250", "300", "400", "500", "550", "600",
	"700", "800", "850", "900", "1000"
];
/** Brand ramp percentages shared by `--dsw-static-deepseek-*`. */
const BRAND_RAMP = {
	"50": 0.08,
	"100": 0.16,
	"200": 0.28,
	"300": 0.42,
	"400": 0.58,
	"450": 0.70,
	"500": 1,
	"600": 1.08,
	"800": 0.26,
	"900": 0.18
};
/** Look up a palette (falls back to the first one). */
const themeById = (id) => THEMES.find((entry) => entry.id === id) || THEMES[0];
/** Look up an accent (falls back to the palette's official accent). */
const accentById = (id) => ACCENTS.find((entry) => entry.id === id) || ACCENTS[0];
const BUTTON_STEPS = [0, 0.08, 0.16, 0.26, 0.38, 0.52, 0.68, 0.84];
/**
 * Accent fill for buttons: stay on the accent while its own label colour clears
 * 4.5:1, otherwise walk toward black/white until the label becomes legible.
 */
function accentFill(accent) {
	for (const amount of BUTTON_STEPS) {
		const targets = amount === 0 ? ["#000000"] : ["#000000", "#FFFFFF"];
		for (const target of targets) {
			const candidate = mix(accent, target, amount);
			if (contrast(onColor(candidate), candidate) >= 4.5) return candidate;
		}
	}
	return accent;
}
/**
 * Surface ramp anchors for a palette: step -> colour. Steps are interpolated in
 * step space so the ramp keeps the ordering the built-in aliases expect while
 * carrying the palette's own tint.
 */
function rampAnchors(theme) {
	const a = theme.ui;
	if (theme.scheme === "dark") return {
		"1000": shade(a.bg, -0.30),
		"950": a.bg,
		"900": a.contrast,
		"875": a.secondBg,
		"850": a.active,
		"800": a.highlight,
		"750": mix(a.highlight, a.fg, 0.14),
		"700": mix(a.highlight, a.fg, 0.28),
		"600": mix(a.highlight, a.fg, 0.42),
		"500": mix(a.highlight, a.fg, 0.54),
		"400": mix(a.highlight, a.fg, 0.64),
		"300": mix(a.highlight, a.fg, 0.72),
		"250": mix(a.highlight, a.fg, 0.77),
		"200": mix(a.highlight, a.fg, 0.82),
		"150": mix(a.highlight, "#FFFFFF", 0.86),
		"100": mix(a.highlight, "#FFFFFF", 0.90),
		"75": mix(a.highlight, "#FFFFFF", 0.94),
		"60": mix(a.highlight, "#FFFFFF", 0.96),
		"50": mix(a.highlight, "#FFFFFF", 0.97),
		"00": "#FFFFFF"
	};
	return {
		"1000": mix(a.fg, "#000000", 0.18),
		"950": a.fg,
		"900": mix(a.fg, "#FFFFFF", 0.12),
		"875": mix(a.text, "#FFFFFF", 0.05),
		"850": mix(a.text, "#FFFFFF", 0.22),
		"800": a.disabled,
		"750": mix(a.disabled, "#FFFFFF", 0.30),
		"700": mix(a.disabled, "#FFFFFF", 0.45),
		"600": mix(a.disabled, "#FFFFFF", 0.58),
		"500": mix(a.disabled, "#FFFFFF", 0.68),
		"400": mix(a.disabled, "#FFFFFF", 0.76),
		"300": mix(a.disabled, "#FFFFFF", 0.82),
		"250": mix(a.disabled, "#FFFFFF", 0.86),
		"200": mix(a.disabled, "#FFFFFF", 0.88),
		"150": mix(a.disabled, "#FFFFFF", 0.90),
		"100": mix(a.disabled, "#FFFFFF", 0.92),
		"75": mix(a.disabled, "#FFFFFF", 0.94),
		"60": mix(a.disabled, "#FFFFFF", 0.95),
		"50": mix(a.disabled, "#FFFFFF", 0.96),
		"00": "#FFFFFF"
	};
}
/** Interpolate a ramp step colour from the anchor table. */
function rampColor(anchors, steps, step) {
	const name = String(step);
	if (anchors[name] !== undefined) return anchors[name];
	const numeric = Number(name);
	const sorted = steps.map((key) => ({
		step: Number(key),
		color: anchors[key]
	}));
	for (let i = 0; i < sorted.length - 1; i++) {
		const left = sorted[i];
		const right = sorted[i + 1];
		if (numeric > left.step && numeric < right.step) {
			return mix(left.color, right.color, (numeric - left.step) / (right.step - left.step));
		}
	}
	return anchors["00"];
}
/** Accent tone: `t < 1` blends from the surface into the accent, `t > 1` toward white. */
function accentTone(accent, base, t) {
	if (t <= 1) return mix(base, accent, t);
	return mix(accent, "#FFFFFF", Math.min(0.85, t - 1));
}
/** Every token value for one scheme of one palette. */
function schemeTokens(theme, accentId) {
	const a = theme.ui;
	const s = theme.syntax;
	const tokens = {};
	const set = (name, value) => {
		tokens[name] = value;
	};
	const accent = accentId === "auto" || !accentById(accentId).value ? a.accent : accentById(accentId).value;
	const fill = accentFill(accent);
	const ink = onColor(fill);
	/**
	 * Nudge `color` toward the scheme's extreme until it clears `minimum` on every
	 * surface the text can sit on: base, layer-1, layer-2 and layer-3.
	 */
	const surfaces = [a.bg, a.secondBg, a.active, a.highlight];
	const ensure = (color, minimum) => {
		const toward = theme.scheme === "dark" ? "#FFFFFF" : "#000000";
		const passes = (candidate) => surfaces.every((surface) => contrast(candidate, surface) >= minimum);
		if (passes(color)) return color;
		let out = color;
		for (let i = 1; i <= 32; i++) {
			out = mix(color, toward, i / 32);
			if (passes(out)) break;
		}
		return out;
	};
	/** Border token: the official border, nudged when it would vanish into the base. */
	const border = contrast(a.border, a.bg) >= 1.05 ? a.border : mix(a.border, a.fg, 0.22);
	/** Sidebar fill: the official layer, nudged when it equals the base exactly. */
	const sidebar = contrast(a.secondBg, a.bg) >= 1.01 ? a.secondBg : mix(a.bg, a.fg, 0.045);
	/** Bubble fill: a tinted layer that always reads as a separate surface. */
	const bubbleCandidates = [mix(a.secondBg, accent, 0.16), mix(a.bg, accent, 0.22), mix(a.bg, a.fg, 0.08)];
	const bubble = bubbleCandidates.find((candidate) => contrast(candidate, a.bg) >= 1.02) || mix(a.bg, a.fg, 0.10);
	// --- surfaces ---
	set("--dsw-alias-bg-base", a.bg);
	set("--dsw-alias-bg-layer-1", a.secondBg);
	set("--dsw-alias-bg-layer-2", a.active);
	set("--dsw-alias-bg-layer-3", a.highlight);
	set("--dsw-alias-bg-module-platform", a.secondBg);
	set("--dsw-alias-bg-multi-select", mix(a.active, accent, 0.30));
	set("--dsw-alias-bg-overlay", a.contrast);
	set("--dsw-alias-bg-skeleton", alpha(a.fg, theme.scheme === "dark" ? 0.08 : 0.06));
	// --- borders ---
	set("--dsw-alias-border-l1", alpha(border, 0.55));
	set("--dsw-alias-border-l2", border);
	set("--dsw-alias-border-l2-darkmode-thin", alpha(border, 0.45));
	set("--dsw-alias-border-l3", mix(border, a.fg, 0.22));
	set("--dsw-alias-border-l4", mix(border, a.fg, 0.40));
	set("--dsw-alias-border-inverted", alpha(a.fg, 0.12));
	set("--dsw-alias-border-inverted2", alpha(a.fg, 0.18));
	// --- brand & buttons ---
	set("--dsw-alias-brand-primary", fill);
	set("--dsw-alias-brand-primary-invert", ink);
	set("--dsw-alias-brand-text", ensure(accent, 4.5));
	set("--dsw-alias-brand-primary-new-colorprimary-new-color", fill);
	set("--dsw-alias-button-primary-fill", fill);
	set("--dsw-alias-button-primary-hover", mix(fill, ink, 0.12));
	set("--dsw-alias-button-primary-dimmed", alpha(accent, 0.28));
	set("--dsw-alias-button-contrast-fill", a.fg);
	set("--dsw-alias-button-elevated-fill", a.buttons);
	set("--dsw-alias-button-floating-fill", a.secondBg);
	set("--dsw-alias-button-floating-hover", a.highlight);
	set("--dsw-alias-button-ghost-active-fill", alpha(accent, 0.16));
	set("--dsw-alias-button-ghost-active-hover", alpha(accent, 0.24));
	set("--dsw-alias-button-ghost-active-border", alpha(accent, 0.55));
	set("--dsw-alias-button-info-fill", fill);
	set("--dsw-alias-button-info-hover", mix(fill, ink, 0.10));
	// --- interaction ---
	set("--dsw-alias-interactive-bg-hover", alpha(a.fg, 0.07));
	set("--dsw-alias-interactive-bg-hover-solid", a.active);
	set("--dsw-alias-interactive-bg-hover-accent", alpha(accent, 0.16));
	set("--dsw-alias-interactive-bg-hover-danger", alpha(s.error, 0.14));
	set("--dsw-alias-interactive-bg-active", alpha(a.fg, 0.12));
	// --- labels ---
	set("--dsw-alias-label-primary", ensure(a.fg, 7));
	set("--dsw-alias-label-primary-bluish", ensure(mix(a.fg, accent, 0.35), 4.5));
	set("--dsw-alias-label-primary-dimmed", mix(a.bg, a.fg, 0.85));
	set("--dsw-alias-label-primary-foreground", ink);
	set("--dsw-alias-label-primary-inverted", theme.scheme === "dark" ? "#0B0C10" : "#FFFFFF");
	set("--dsw-alias-label-secondary", ensure(a.text, 4.5));
	set("--dsw-alias-label-tertiary", ensure(a.disabled, 3));
	set("--dsw-alias-label-caption", ensure(a.disabled, 2.2));
	set("--dsw-alias-label-dimmed", mix(a.bg, a.fg, 0.14));
	set("--dsw-alias-link", ensure(s.links, 4.5));
	// --- markdown ---
	set("--dsw-alias-markdown-code-block", a.contrast);
	set("--dsw-alias-markdown-code-block-banner", mix(a.contrast, a.active, 0.5));
	set("--dsw-alias-markdown-code-segment-selected", a.active);
	set("--dsw-alias-markdown-code-segment-unselected", a.secondBg);
	set("--dsw-alias-markdown-inline-code", a.buttons);
	set("--dsw-alias-markdown-placeholder", ensure(a.disabled, 2.2));
	set("--dsw-alias-markdown-tag", a.highlight);
	set("--dsw-alias-markdown-citation", mix(a.bg, accent, 0.12));
	// --- scrollbars ---
	set("--dsw-alias-scrollbar-bg-l1", alpha(a.fg, 0.18));
	set("--dsw-alias-scrollbar-bg-l2", alpha(a.fg, 0.14));
	set("--dsw-alias-scrollbar-hover-l1", alpha(a.fg, 0.30));
	set("--dsw-alias-scrollbar-hover-l2", alpha(a.fg, 0.24));
	// --- state ---
	set("--dsw-alias-state-business-primary", ensure(accent, 4.5));
	set("--dsw-alias-state-business-tertiary", alpha(accent, 0.14));
	set("--dsw-alias-state-error-primary", ensure(s.error, 3));
	set("--dsw-alias-state-error-secondary", ensure(mix(s.error, a.bg, 0.35), 3));
	set("--dsw-alias-state-success-primary", ensure(s.strings, 3));
	set("--dsw-alias-state-success-secondary", ensure(mix(s.strings, a.bg, 0.35), 3));
	set("--dsw-alias-state-success-tertiary", alpha(s.strings, 0.14));
	set("--dsw-alias-state-warn-primary", ensure(s.attributes, 3));
	set("--dsw-alias-state-warn-secondary", ensure(mix(s.attributes, a.bg, 0.35), 3));
	set("--dsw-alias-state-warn-tertiary", alpha(s.attributes, 0.14));
	set("--dsw-alias-state-warn-label", ensure(s.attributes, 3));
	// --- specifics ---
	set("--dsw-specific-bubble", bubble);
	set("--dsw-specific-bubble-highlight", mix(a.active, accent, 0.16));
	set("--dsw-specific-input-major", a.buttons);
	set("--dsw-specific-login-input", a.bg);
	set("--dsw-specific-menu", a.highlight);
	set("--dsw-specific-selector", a.secondBg);
	set("--dsw-specific-sidebar-fill", sidebar);
	set("--dsw-specific-sidebar-nav-item-active", mix(a.active, accent, 0.10));
	set("--dsw-specific-sidebar-nav-item-active-accent", alpha(accent, 0.28));
	set("--dsw-specific-sidebar-nav-item-hover", alpha(a.fg, 0.06));
	set("--dsw-specific-tip", a.secondBg);
	set("--dsw-alias-toast-bg", theme.scheme === "dark" ? a.highlight : mix(a.fg, "#000000", 0.55));
	set("--dsw-alias-tooltip-bg", theme.scheme === "dark" ? mix(a.highlight, a.fg, 0.06) : mix(a.fg, "#000000", 0.5));
	// --- elevation: Material depth, restrained like the IDE ---
	if (theme.scheme === "dark") {
		set("--dsw-shadow-lv1", "0 1px 2px rgba(0, 0, 0, 0.44), 0 1px 1px rgba(0, 0, 0, 0.28)");
		set("--dsw-shadow-lv1-blur", "0 6px 16px rgba(0, 0, 0, 0.36)");
		set("--dsw-shadow-lv2", "0 2px 6px rgba(0, 0, 0, 0.48), 0 1px 2px rgba(0, 0, 0, 0.32)");
		set("--dsw-shadow-lv3", "0 10px 28px rgba(0, 0, 0, 0.56), 0 2px 8px rgba(0, 0, 0, 0.36)");
	} else {
		set("--dsw-shadow-lv1", "0 1px 2px rgba(16, 24, 40, 0.10), 0 1px 1px rgba(16, 24, 40, 0.06)");
		set("--dsw-shadow-lv1-blur", "0 4px 12px rgba(16, 24, 40, 0.10)");
		set("--dsw-shadow-lv2", "0 2px 4px rgba(16, 24, 40, 0.10), 0 1px 2px rgba(16, 24, 40, 0.06)");
		set("--dsw-shadow-lv3", "0 8px 24px rgba(16, 24, 40, 0.14), 0 2px 6px rgba(16, 24, 40, 0.08)");
	}
	// --- thinking gradient ---
	set("--dsw-linear-gradient-think", "linear-gradient(180deg, " + a.bg + " 20.19%, " + alpha(a.bg, 0) + " 100%)");
	set("--dsw-linear-think-select", "linear-gradient(180deg, " + a.active + " 20.19%, " + alpha(a.active, 0) + " 100%)");
	// --- surface ramps consumed directly by feature packages ---
	const anchors = rampAnchors(theme);
	for (const step of BLUISH_STEPS) set("--dsw-static-neutral-bluish-" + step, rampColor(anchors, BLUISH_STEPS, step));
	for (const step of NEUTRAL_STEPS) set("--dsw-static-neutral-" + step, rampColor(anchors, NEUTRAL_STEPS, step));
	for (const step of Object.keys(BRAND_RAMP)) set("--dsw-static-deepseek-" + step, accentTone(accent, a.bg, BRAND_RAMP[step]));
	// --- syntax highlighting ---
	set("--shiki-token-keyword", s.keywords);
	set("--shiki-token-string", s.strings);
	set("--shiki-token-comment", s.comments);
	set("--shiki-token-constant", s.numbers);
	set("--shiki-token-parameter", s.parameters);
	set("--shiki-token-function", s.functions);
	set("--shiki-token-string-expression", s.strings);
	set("--shiki-token-punctuation", s.operators);
	set("--shiki-token-link", s.links);
	set("--shiki-foreground", s.variables);
	set("--shiki-background", a.contrast);
	return tokens;
}
/**
 * Resolve `{ light, dark }` for every token of one palette + accent. A light
 * palette feeds the light half and borrows Oceanic for the dark half (and vice
 * versa), so flipping Appearance still lands on a Material palette.
 */
function buildTokens(themeId, accentId) {
	const theme = themeById(themeId);
	const lightTheme = theme.scheme === "light" ? theme : themeById("lighter");
	const darkTheme = theme.scheme === "dark" ? theme : themeById("oceanic");
	const light = schemeTokens(lightTheme, accentId);
	const dark = schemeTokens(darkTheme, accentId);
	const tokens = {};
	for (const name of Object.keys(light)) {
		tokens[name] = {
			light: light[name],
			dark: dark[name]
		};
	}
	return tokens;
}
//#endregion
//#region dsh-material-theme/client/settings.js
/**
 * Persisted plugin preferences. The palette and accent live here because the
 * built-in theme service only persists light/dark/system.
 */
const STORAGE_KEY = "dsh.material-theme.v2";
const LEGACY_KEY = "dsh.material-theme.v1";
const DEFAULT_CONFIG = {
	palette: "oceanic",
	accent: "auto"
};
/** Palette ids renamed when the plugin adopted the official palette list. */
const LEGACY_PALETTES = {
	ocean: "oceanic"
};
/** Accent ids renamed when the plugin adopted the official accent list. */
const LEGACY_ACCENTS = {
	blue: "water",
	purple: "lavender",
	pink: "strawberry",
	red: "tomato",
	brown: "coffee",
	grey: "silver",
	green: "plant",
	yellow: "amber"
};
/** Map a stored preference record onto the current id vocabulary. */
function migrateConfig(parsed) {
	const raw = parsed && typeof parsed === "object" ? parsed : {};
	return {
		palette: typeof raw.palette === "string" ? LEGACY_PALETTES[raw.palette] || raw.palette : DEFAULT_CONFIG.palette,
		accent: typeof raw.accent === "string" ? LEGACY_ACCENTS[raw.accent] || raw.accent : DEFAULT_CONFIG.accent
	};
}
/** Read the stored config, falling back to the defaults on any problem. */
function readConfig() {
	try {
		const current = window.localStorage.getItem(STORAGE_KEY);
		if (current) return migrateConfig(JSON.parse(current));
		const legacy = window.localStorage.getItem(LEGACY_KEY);
		if (legacy) return migrateConfig(JSON.parse(legacy));
		return {
			...DEFAULT_CONFIG
		};
	} catch {
		return {
			...DEFAULT_CONFIG
		};
	}
}
/** Persist the config; storage failures are non-fatal. */
function writeConfig(config) {
	try {
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
	} catch {}
}
/**
 * Live config shared by every surface (settings row, header menu). The runtime
 * side registers an applier; UI surfaces subscribe so both stay in sync.
 */
const configListeners = new Set();
let activeConfig = null;
let runtimeApply = null;
/** Current config, loaded once from storage. */
function getConfig() {
	if (activeConfig === null) activeConfig = readConfig();
	return activeConfig;
}
/** Replace the live config, persist it and notify subscribers. */
function setConfig(next) {
	activeConfig = next;
	writeConfig(next);
	for (const listener of [...configListeners]) {
		try {
			listener(next);
		} catch {}
	}
}
/** Subscribe to config changes; returns the unsubscribe function. */
function subscribeConfig(listener) {
	configListeners.add(listener);
	return () => configListeners.delete(listener);
}
/** Commit a config the user picked: persist, then hand it to the theme runtime. */
function commitConfig(next) {
	setConfig(next);
	if (runtimeApply) runtimeApply(next);
}
/** React hook: the live config, re-rendering on every change. */
function useConfigState() {
	const [config, setLocal] = react.useState(getConfig);
	react.useEffect(() => subscribeConfig(setLocal), []);
	return config;
}
//#endregion
//#region dsh-material-theme/client/row.css
		const rowCss = ".dmt_group{border-bottom:.5px solid var(--dsw-alias-border-l2);flex-direction:column;gap:10px;padding:16px 0;display:flex}.dmt_title{color:var(--dsw-alias-label-primary);font-size:14px;font-weight:400;line-height:22px}.dmt_desc{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}.dmt_legend{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;margin-top:2px;font-weight:500}.dmt_groupInner .dmt_groupInner{gap:6px;margin-top:6px}.dmt_groupInner .dmt_groupInner .dmt_legend{font-weight:400;opacity:.8}.dmt_row{flex-wrap:wrap;align-items:stretch;gap:8px;display:flex}.dmt_card{box-sizing:border-box;border:.5px solid var(--dsw-alias-border-l4);background:var(--dmt-card-bg);border-radius:12px;flex-direction:column;flex:0 1 132px;justify-content:space-between;gap:10px;min-height:64px;padding:10px 12px;font:inherit;font-size:13px;line-height:18px;color:var(--dmt-card-fg);text-align:left;cursor:pointer;display:flex;transition:box-shadow .15s var(--ds-ease-in-out),transform .15s var(--ds-ease-in-out)}.dmt_card:hover{box-shadow:var(--dsw-shadow-lv2)}.dmt_card[aria-checked=true]{box-shadow:inset 0 0 0 1.5px var(--dmt-card-accent),var(--dsw-shadow-lv1)}.dmt_card:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}.dmt_cardName{font-weight:500;display:flex;align-items:center;gap:6px;justify-content:space-between}.dmt_check{font-size:12px;line-height:1;opacity:0}.dmt_card[aria-checked=true] .dmt_check{opacity:1}.dmt_swatches{gap:4px;display:flex}.dmt_swatch{width:18px;height:8px;border-radius:3px;display:block}.dmt_dots{flex-wrap:wrap;gap:8px;display:flex}.dmt_dot{box-sizing:border-box;border:2px solid transparent;border-radius:50%;width:24px;height:24px;padding:0;cursor:pointer;position:relative;display:grid;place-items:center;color:#0B0C10;font-size:12px;line-height:1}.dmt_dot:hover{transform:scale(1.06)}.dmt_dot:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}.dmt_dot[aria-checked=true]{box-shadow:0 0 0 2px var(--dsw-alias-bg-base),0 0 0 4px var(--dsw-alias-brand-primary)}.dmt_dotCheck{opacity:0}.dmt_dot[aria-checked=true] .dmt_dotCheck{opacity:1}.dmt_groups{display:flex;flex-direction:column;gap:12px}.dmt_groupInner{display:flex;flex-direction:column;gap:8px}.dmt_dotAuto{border-style:dashed}.dmt_menu{position:relative;display:inline-flex;align-items:center}.dmt_trigger{display:inline-flex;align-items:center;gap:5px;height:26px;padding:0 7px 0 8px;border:.5px solid var(--dsw-alias-border-l3);border-radius:13px;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;line-height:24px;cursor:pointer;max-width:140px}.dmt_trigger:hover{background:var(--dsw-alias-interactive-bg-hover)}.dmt_trigger:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}.dmt_triggerName{max-width:88px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.dmt_caret{font-size:10px;line-height:1;opacity:.65}.dmt_headDot{width:10px;height:10px;border-radius:3px;border:1px solid currentColor;flex:none;display:block}.dmt_panel{position:fixed;top:56px;right:24px;z-index:80;width:168px;max-height:min(420px,72vh);overflow:auto;padding:5px;border-radius:12px;border:.5px solid var(--dsw-alias-border-l3);background:var(--dsw-alias-bg-layer-2);box-shadow:var(--dsw-elevation-panel);color:var(--dsw-alias-label-primary);display:flex;flex-direction:column;gap:1px}.dmt_panelLegend{padding:6px 6px 3px;font-size:11px;line-height:15px;color:var(--dsw-alias-label-tertiary)}.dmt_panelGroup{display:flex;flex-direction:column;gap:1px}.dmt_opt{display:flex;align-items:center;gap:6px;width:100%;padding:4px 6px;border:none;border-radius:7px;background:transparent;color:inherit;font:inherit;font-size:12px;line-height:17px;text-align:left;cursor:pointer}.dmt_opt:hover{background:var(--dsw-alias-interactive-bg-hover)}.dmt_opt[aria-selected=true]{background:var(--dsw-alias-interactive-bg-hover-solid)}.dmt_optSwatches{display:inline-flex;gap:2px;flex:none;padding:1px 2px;border-radius:4px}.dmt_optSwatch{display:block;width:6px;height:14px;border-radius:2px}.dmt_optSystem{width:26px;height:16px;border:1px dashed var(--dsw-alias-border-l3);border-radius:4px}.dmt_optName{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.dmt_optCheck{font-size:10px;opacity:.9}.dmt_off{color:var(--dsw-alias-label-tertiary);background:0 0;border:.5px dashed var(--dsw-alias-border-l3);border-radius:12px;padding:10px 12px;font:inherit;font-size:13px;line-height:18px;cursor:pointer}.dmt_off:hover{background:var(--dsw-alias-interactive-bg-hover)}.dmt_off[aria-checked=true]{border-style:solid;border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-primary)}";
		/** Mount the row stylesheet exactly once. */
		function installStyles() {
			if (typeof document === "undefined") return;
			const tagId = "dsh-material-theme/row.css";
			if (document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") !== null) return;
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-material-theme";
			tag.dataset.pluginCss = tagId;
			tag.textContent = rowCss;
			document.head.appendChild(tag);
		}
		//#endregion
//#region dsh-material-theme/client/Row.js
const h = react.createElement;
/** One palette card: the palette's own surfaces plus its accent as a preview. */
function ThemeCard(props) {
	const { theme, t, checked, onSelect } = props;
	const a = theme.ui;
	return h("button", {
		type: "button",
		role: "radio",
		"aria-checked": checked,
		className: "dmt_card",
		style: {
			"--dmt-card-bg": a.bg,
			"--dmt-card-fg": a.fg,
			"--dmt-card-accent": a.accent
		},
		onClick: () => onSelect(theme.id)
	}, h("span", {
		className: "dmt_cardName"
	}, t("material.theme." + theme.id), h("span", {
		className: "dmt_check",
		"aria-hidden": "true"
	}, "✓")), h("span", {
		className: "dmt_swatches",
		"aria-hidden": "true"
	}, h("span", {
		className: "dmt_swatch",
		style: {
			background: a.secondBg
		}
	}), h("span", {
		className: "dmt_swatch",
		style: {
			background: a.active
		}
	}), h("span", {
		className: "dmt_swatch",
		style: {
			background: a.highlight
		}
	}), h("span", {
		className: "dmt_swatch",
		style: {
			background: a.accent
		}
	})));
}
/** Accent dot rendered inside the row. */
function AccentDot(props) {
	const { accent, checked, onSelect } = props;
	return h("button", {
		type: "button",
		role: "radio",
		"aria-checked": checked,
		"aria-label": accent.label,
		title: accent.zh,
		className: "dmt_dot",
		style: {
			background: accent.value,
			color: onColor(accent.value)
		},
		onClick: () => onSelect(accent.id)
	}, h("span", {
		className: "dmt_dotCheck",
		"aria-hidden": "true"
	}, "✓"));
}
/**
 * Ordering: within each category the light palettes come first and the dark
 * palettes after, and each list runs from the lightest to the deepest, so a
 * whole category reads as one continuous light -> deep ramp.
 */
const byBrightness = (a, b) => luminance(b.ui.bg) - luminance(a.ui.bg);
const MATERIAL_LIGHT = THEMES.filter((theme) => theme.group === "material" && theme.scheme === "light").sort(byBrightness);
const MATERIAL_DARK = THEMES.filter((theme) => theme.group === "material" && theme.scheme === "dark").sort(byBrightness);
const OTHER_LIGHT = THEMES.filter((theme) => theme.group === "other" && theme.scheme === "light").sort(byBrightness);
const OTHER_DARK = THEMES.filter((theme) => theme.group === "other" && theme.scheme === "dark").sort(byBrightness);
/** Menu order: light palettes first, then dark, both lightest -> deepest. */
const MENU_GROUPS = [{
	key: "material",
	labelKey: "material.group.material",
	themes: [...MATERIAL_LIGHT, ...MATERIAL_DARK]
}, {
	key: "other",
	labelKey: "material.group.other",
	themes: [...OTHER_LIGHT, ...OTHER_DARK]
}];
/** One row of the header dropdown: the palette's own colours plus its name. */
function MenuOption(props) {
	const { theme, label, checked, onSelect } = props;
	const a = theme.ui;
	return h("button", {
		type: "button",
		role: "option",
		"aria-selected": checked,
		className: "dmt_opt",
		onClick: () => onSelect(theme.id)
	}, h("span", {
		className: "dmt_optSwatches",
		"aria-hidden": "true",
		style: {
			background: a.bg
		}
	}, h("span", {
		className: "dmt_optSwatch",
		style: {
			background: a.secondBg
		}
	}), h("span", {
		className: "dmt_optSwatch",
		style: {
			background: a.accent
		}
	}), h("span", {
		className: "dmt_optSwatch",
		style: {
			background: a.fg
		}
	})), h("span", {
		className: "dmt_optName"
	}, label), checked ? h("span", {
		className: "dmt_optCheck",
		"aria-hidden": "true"
	}, "✓") : null);
}
/** Conversation-header menu: quick theme switch with colour previews. */
function MaterialMenu({ t }) {
	const config = useConfigState();
	const [open, setOpen] = react.useState(false);
	const [anchor, setAnchor] = react.useState(null);
	const root = react.useRef(null);
	react.useEffect(() => {
		if (!open) return;
		// the panel is fixed-positioned from the trigger rect, so it is never
		// clipped by the header or a scrolling ancestor
		const place = () => {
			const element = root.current;
			if (!element || typeof element.getBoundingClientRect !== "function") return;
			const rect = element.getBoundingClientRect();
			const viewport = typeof window !== "undefined" && typeof window.innerWidth === "number" ? window.innerWidth : 1024;
			setAnchor({
				top: Math.round(rect.bottom + 6),
				right: Math.round(viewport - rect.right)
			});
		};
		const onPointer = (event) => {
			if (root.current && !root.current.contains(event.target)) setOpen(false);
		};
		const onKey = (event) => {
			if (event.key === "Escape") setOpen(false);
		};
		place();
		window.addEventListener("resize", place);
		window.addEventListener("scroll", place, true);
		document.addEventListener("pointerdown", onPointer);
		document.addEventListener("keydown", onKey);
		return () => {
			window.removeEventListener("resize", place);
			window.removeEventListener("scroll", place, true);
			document.removeEventListener("pointerdown", onPointer);
			document.removeEventListener("keydown", onKey);
		};
	}, [open]);
	const current = themeById(config.palette);
	const choose = (palette) => {
		setOpen(false);
		commitConfig({
			...config,
			palette
		});
	};
	return h("div", {
		className: "dmt_menu",
		ref: root
	}, h("button", {
		type: "button",
		className: "dmt_trigger",
		onClick: () => setOpen(!open),
		"aria-haspopup": "listbox",
		"aria-expanded": open,
		title: t("material.menu")
	}, h("span", {
		className: "dmt_headDot",
		"aria-hidden": "true",
		style: {
			background: current ? current.ui.bg : "transparent",
			borderColor: current ? current.ui.accent : "currentColor"
		}
	}), h("span", {
		className: "dmt_triggerName"
	}, current ? t("material.theme." + current.id) : t("material.system")), h("span", {
		className: "dmt_caret",
		"aria-hidden": "true"
	}, "▾")), open ? h("div", {
		className: "dmt_panel",
		role: "listbox",
		"aria-label": t("material.menu"),
		style: anchor ? {
			top: anchor.top + "px",
			right: anchor.right + "px"
		} : undefined
	}, h("button", {
		type: "button",
		role: "option",
		"aria-selected": !current,
		className: "dmt_opt",
		onClick: () => choose("none")
	}, h("span", {
		className: "dmt_optSwatches dmt_optSystem",
		"aria-hidden": "true"
	}), h("span", {
		className: "dmt_optName"
	}, t("material.system"))), MENU_GROUPS.map((group) => h("div", {
		className: "dmt_panelGroup",
		key: group.key
	}, h("div", {
		className: "dmt_panelLegend"
	}, t(group.labelKey)), group.themes.map((theme) => h(MenuOption, {
		key: theme.id,
		theme,
		label: t("material.theme." + theme.id),
		checked: config.palette === theme.id,
		onSelect: choose
	}))))) : null);
}
/**
 * Settings → General row: official palettes grouped like the reference page,
 * the official accent colours and an off switch. Props come from the slot (`t`
 * via the locale namespace, `onApply` via `inject`).
 */
function MaterialRow({ t }) {
	const config = useConfigState();
	const update = (patch) => commitConfig({
		...config,
		...patch
	});
	const enabled = config.palette !== "none";
	const current = themeById(config.palette);
	const group = (legendKey, themes) => h("div", {
		className: "dmt_groupInner"
	}, h("div", {
		className: "dmt_legend"
	}, t(legendKey)), h("div", {
		className: "dmt_row",
		role: "radiogroup",
		"aria-label": t(legendKey)
	}, themes.map((theme) => h(ThemeCard, {
		key: theme.id,
		theme,
		t,
		checked: config.palette === theme.id,
		onSelect: (id) => update({
			palette: id
		})
	}))));
	const sub = (legendKey, themes) => themes.length === 0 ? null : group(legendKey, themes);
	return h("div", {
		className: "dmt_group"
	}, h("div", {}, h("div", {
		className: "dmt_title"
	}, t("material.title")), h("div", {
		className: "dmt_desc"
	}, t("material.description"))), h("div", {
		className: "dmt_groups"
	}, h("div", {
		className: "dmt_groupInner"
	}, h("div", {
		className: "dmt_legend"
	}, t("material.group.material")), sub("material.light", MATERIAL_LIGHT), sub("material.dark", MATERIAL_DARK)), h("div", {
		className: "dmt_groupInner"
	}, h("div", {
		className: "dmt_legend"
	}, t("material.group.other")), sub("material.light", OTHER_LIGHT), sub("material.dark", OTHER_DARK))), h("div", {
		className: "dmt_row"
	}, h("button", {
		type: "button",
		role: "radio",
		"aria-checked": !enabled,
		className: "dmt_off",
		onClick: () => update({
			palette: "none"
		})
	}, t("material.off"))), enabled ? h("div", {
		className: "dmt_legend"
	}, t("material.accent")) : null, enabled ? h("div", {
		className: "dmt_dots",
		role: "radiogroup",
		"aria-label": t("material.accent")
	}, h("button", {
		type: "button",
		role: "radio",
		"aria-checked": config.accent === "auto",
		"aria-label": t("material.official"),
		title: t("material.official"),
		className: "dmt_dot dmt_dotAuto",
		style: {
			background: current.ui.accent,
			color: onColor(current.ui.accent)
		},
		onClick: () => update({
			accent: "auto"
		})
	}, h("span", {
		className: "dmt_dotCheck",
		"aria-hidden": "true"
	}, "✓")), ACCENTS.filter((accent) => accent.value !== null).map((accent) => h(AccentDot, {
		key: accent.id,
		accent,
		checked: config.accent === accent.id,
		onSelect: (id) => update({
			accent: id
		})
	}))) : null);
}
//#endregion
//#region dsh-material-theme/client/i18n.js
const NAMESPACE = "settings.material-theme";
const BASE_ZH = {
	"material.title": "Material 主题",
	"material.description": "源自 Material Design Experience 的官方配色、海拔与语法高亮；选择立即生效并记住。",
	"material.group.material": "Material 官方主题",
	"material.group.other": "其他主题",
	"material.dark": "深色 · 由浅到深",
	"material.light": "浅色 · 由浅到深",
	"material.system": "跟随外观",
	"material.menu": "主题",
	"material.accent": "强调色",
	"material.official": "跟随主题（官方强调色）",
	"material.off": "关闭（使用 DSH 默认外观）"
};
const BASE_EN = {
	"material.title": "Material theme",
	"material.description": "Official Material Design Experience palettes, elevation and syntax colours — applied immediately and remembered.",
	"material.group.material": "Material themes",
	"material.group.other": "Other themes",
	"material.dark": "Dark · light to deep",
	"material.light": "Light · light to deep",
	"material.system": "Follow appearance",
	"material.menu": "Theme",
	"material.accent": "Accent",
	"material.official": "Follow the palette (official accent)",
	"material.off": "Off (use DSH appearance)"
};
/** Add one translation key per palette, so the cards read in the UI language. */
function withThemeNames(base, lang) {
	const out = {
		...base
	};
	for (const theme of THEMES) out["material.theme." + theme.id] = lang === "zh" ? theme.zh : theme.name;
	return out;
}
const zh = withThemeNames(BASE_ZH, "zh");
const en = withThemeNames(BASE_EN, "en");
//#endregion
//#region dsh-material-theme/client/index.js
/** Tokens layer source name; one layer so re-applying replaces it. */
const LAYER_SOURCE = "dsh-material-theme";
/** Required client services. */
const inject = ["slots", "locale", "theme"];
/**
 * Client entry: align the shell's colour scheme with the chosen palette, stack
 * the palette's token layer on the active theme and add the settings row.
 */
function apply(ctx) {
	installStyles();
	const theme = ctx.theme;
	let config = readConfig();
	let layerDispose = null;
	/** Rebuild the token layer for `next`, or drop it for "none". */
	const applyLayer = (next) => {
		if (layerDispose) {
			layerDispose();
			layerDispose = null;
		}
		if (next.palette === "none") return;
		layerDispose = theme.overrideTokens(LAYER_SOURCE, buildTokens(next.palette, next.accent));
	};
	/** Force the matching appearance so the presenter selects the right half. */
	const applyScheme = (next) => {
		if (next.palette === "none") {
			theme.setTheme("system");
			return;
		}
		const palette = themeById(next.palette);
		if (theme.getTheme().active.colorScheme !== palette.scheme) theme.setTheme(palette.scheme);
	};
	ctx.effect(() => ctx.locale.register(NAMESPACE, {
		zh,
		en
	}), "dsh-material-theme: dictionaries");
	/** Every config change (settings row or header menu) lands here. */
	runtimeApply = (next) => {
		applyScheme(next);
		applyLayer(next);
	};
	applyScheme(config);
	applyLayer(config);
	ctx.effect(() => () => {
		runtimeApply = null;
	}, "dsh-material-theme: runtime detach");
	ctx.slots.inject("settings.general.item", () => ctx.slots.register({
		name: "settings.general.item",
		id: "material-theme",
		order: 12,
		locale: NAMESPACE
	}, MaterialRow));
	ctx.slots.inject("conversation.session.header.utilities", () => ctx.slots.register({
		name: "conversation.session.header.utilities",
		id: "material-theme",
		order: -20,
		locale: NAMESPACE
	}, MaterialMenu));
}
//#endregion
exports.__lib = {
	ACCENTS,
	en,
	zh,
	BLUISH_STEPS,
	MATERIAL_DARK,
	MATERIAL_LIGHT,
	MENU_GROUPS,
	OTHER_DARK,
	OTHER_LIGHT,
	DEFAULT_CONFIG,
	NEUTRAL_STEPS,
	STORAGE_KEY,
	THEMES,
	accentById,
	accentFill,
	alpha,
	buildTokens,
	contrast,
	luminance,
	mix,
	onColor,
	rampAnchors,
	rampColor,
	readConfig,
	schemeTokens,
	themeById,
	writeConfig
};
exports.apply = apply;
exports.inject = inject;
return module.exports;
	}
	});
