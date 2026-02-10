# org-mdbook

A beautiful, modern theme for exporting Org-mode files to HTML, inspired by [mdBook](https://rust-lang.github.io/mdBook/) - the Rust documentation tool.

## Features

- 📚 **Toggleable Sidebar** - Table of contents in a collapsible sidebar
- 🎨 **Multiple Themes** - Light, Rust, Navy, and Ayu color schemes
- 📱 **Responsive Design** - Works on desktop and mobile
- ⌨ **Keyboard Shortcuts** - `S` to toggle sidebar, `T` for theme menu, arrows for moving between chapters
- 🔍 **Scroll-synced TOC** - Active section highlighted as you scroll
- 💾 **Persistent Settings** - Theme and sidebar state saved in localStorage

## Comparison with Alternatives

| Feature             | org-mdbook | ReadTheOrg | ox-twbs |
|---------------------|------------|------------|---------|
| Toggleable sidebar  | ✅         | ❌         | ❌      |
| Multiple themes     | ✅ (4)     | ❌         | ❌      |
| Mobile responsive   | ✅         | ✅         | ✅      |
| Self-contained HTML | ✅         | ❌         | ❌      |
| Scroll-synced TOC   | ✅         | ✅         | ❌      |
| Keyboard shortcuts  | ✅         | ✅         | ❌      |

## Styles

The theme mimics the familiar [mdBook](https://rust-lang.github.io/mdBook/) layout:

- Fixed sidebar on the left with table of contents
- Menu bar at the top with toggle and theme buttons
- Clean, readable content area

## Installation

### Quick Start (Per-file)

1. Download the theme files:
   ```bash
   git clone git@github.com:agryaznov/org-mdbook.git ~/.emacs.d/org-mdbook
   ```

2. In your org file, add:
   ```org
   #+SETUPFILE: ~/.emacs.d/org-mdbook/org-mdbook.setup
   ```

3. Export with `C-c C-e h o`

### Global Setup (Emacs Configuration)

Add to your `init.el`:

```elisp
;; Add to load-path
(add-to-list 'load-path "~/.emacs.d/org-mdbook/")
(require 'org-mdbook)

;; Set the directory containing CSS and JS files
(setq org-mdbook-resources-dir "~/.emacs.d/org-mdbook/")

;; Optional settings
(setq org-mdbook-embed-resources t)      ; Embed CSS/JS in HTML (default: t)
(setq org-mdbook-use-google-fonts t)     ; Use Google Fonts (default: t)

;; Option A: Enable globally for all HTML exports
(org-mdbook-enable)

;; Option B: Use only for specific exports
;; M-x org-mdbook-export-to-html
```

## Usage

### Per-file Export

Add the setup file reference to your org document:

```org
#+TITLE: My Documentation
#+SETUPFILE: path/to/org-mdbook.setup

* Introduction
Your content here...
```

Then export with `C-c C-e h o`.

### Using Emacs Functions

```elisp
;; Export current buffer with mdBook theme
M-x org-mdbook-export-to-html

;; Export to buffer (preview)
M-x org-mdbook-export-as-html

;; Copy resources to a directory (when not embedding)
M-x org-mdbook-copy-resources
```

### Keyboard Shortcuts (in exported HTML)

| Key     | Action            |
|---------|-------------------|
| `S`     | Toggle sidebar    |
| `T`     | Open theme menu   |
| `←`/`→` | Prev/Next chapter |

## Customization

### CSS Variables

Edit `org-mdbook.css` to customize colors. Key variables:

```css
:root {
  --bg: #ffffff;           /* Page background */
  --fg: #333333;           /* Text color */
  --sidebar-bg: #fafafa;   /* Sidebar background */
  --sidebar-fg: #364149;   /* Sidebar text */
  --sidebar-active: #008cff; /* Active TOC item */
  --link: #4183c4;         /* Link color */
  --code-bg: #fdf6e3;      /* Code block background */
  --table-border: #e8e8e8; /* Table borders */
}
```

### Adding Custom Themes

Add a new theme block to the CSS:

```css
[data-theme="mytheme"] {
  --bg: #your-bg-color;
  --fg: #your-text-color;
  /* ... other variables ... */
}
```

Then add a button in `org-mdbook.js`:

```javascript
// In the menuBar.innerHTML section:
<button data-theme="mytheme">My Theme</button>
```

### Section Numbers

Section numbers are hidden by default. To show them, comment out these lines in `org-mdbook.css`:

```css
/* Comment out to show section numbers */
/*
.section-number-2,
.section-number-3,
.section-number-4,
.section-number-5,
.section-number-6 {
  display: none;
}
*/
```

## Files

| File               | Description                             |
|--------------------|-----------------------------------------|
| `org-mdbook.css`   | Main stylesheet with all themes         |
| `org-mdbook.js`    | JavaScript for sidebar, themes, TOC     |
| `org-mdbook.setup` | Org-mode setup file for per-file use    |
| `org-mdbook.el`    | Emacs Lisp package for global setup     |
| `sample.org`       | Example org file demonstrating features |

## Troubleshooting

### Sidebar not showing

Make sure your org file has a table of contents:
```org
#+OPTIONS: toc:t
```

### Fonts look different

By default, the theme uses Google Fonts. For offline use:
```elisp
(setq org-mdbook-use-google-fonts nil)
```

### Resources not loading

When `org-mdbook-embed-resources` is `nil`, ensure CSS and JS files are in the same directory as your HTML output:
```elisp
M-x org-mdbook-copy-resources RET /path/to/html/output/ RET
```

## License

MIT License. Feel free to use, modify, and distribute.

## Credits

- Inspired by [mdBook](https://github.com/rust-lang/mdBook)
- Built for [Org-mode](https://orgmode.org/)
