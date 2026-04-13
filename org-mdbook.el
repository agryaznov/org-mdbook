;;; org-mdbook.el --- mdBook-style HTML export theme for org-mode -*- lexical-binding: t; -*-

;; Author: Claude
;; Version: 1.0.0
;; Keywords: org, html, export, mdbook
;; Package-Requires: ((emacs "27.1") (org "9.0"))

;;; Commentary:

;; This package provides an mdBook-style HTML export theme for org-mode.
;; 
;; Features:
;; - Toggleable sidebar with table of contents
;; - Multiple color themes (Light, Rust, Navy, Ayu)
;; - Responsive design
;; - Keyboard shortcuts (S = toggle sidebar, T = theme menu)
;; - Scroll-synced TOC highlighting
;;
;; Installation:
;; 1. Copy org-mdbook.css, org-mdbook.js to a directory (e.g., ~/.emacs.d/org-mdbook/)
;; 2. Add this file to your load-path and require it
;; 3. Set `org-mdbook-resources-dir' to point to your resources
;;
;; Usage:
;; Option A: Per-file setup
;;   Add to your org file: #+SETUPFILE: path/to/org-mdbook.setup
;;
;; Option B: Global setup (using this package)
;;   (require 'org-mdbook)
;;   (setq org-mdbook-resources-dir "~/.emacs.d/org-mdbook/")
;;   (org-mdbook-enable)  ; Enable for all HTML exports
;;   ; or use (org-mdbook-export-to-html) for single file export

;;; Code:

(require 'org)
(require 'ox-html)
(require 'org-id)

(defgroup org-mdbook nil
  "Options for the mdBook-style HTML export."
  :tag "Org mdBook"
  :group 'org-export
  :group 'org-export-html)

(defcustom org-mdbook-resources-dir nil
  "Directory containing org-mdbook.css and org-mdbook.js files.
If nil, inline styles will be used."
  :type '(choice (const :tag "Use inline styles" nil)
                 (directory :tag "Resources directory"))
  :group 'org-mdbook)

(defcustom org-mdbook-embed-resources t
  "If non-nil, embed CSS and JS directly in the HTML file.
This makes the HTML file self-contained but larger.
If nil, reference external files (requires copying them alongside HTML)."
  :type 'boolean
  :group 'org-mdbook)

(defcustom org-mdbook-use-google-fonts t
  "If non-nil, include Google Fonts (Open Sans, Source Code Pro).
Set to nil for offline use or to use system fonts."
  :type 'boolean
  :group 'org-mdbook)

;;; ID link resolution

(defun org-mdbook--title-to-slug (title)
  "Convert TITLE to a hyphen-separated lowercase slug for use as a filename."
  (downcase
   (replace-regexp-in-string
    "-+" "-"
    (replace-regexp-in-string
     "[^a-z0-9-]" ""
     (replace-regexp-in-string
      "[ \t_]+" "-"
      (string-trim title))))))

(defun org-mdbook--get-node-title (id)
  "Return the title of the org node identified by ID, or nil if not found."
  (let ((location (org-id-find id)))
    (when location
      (let ((file (car location))
            (pos  (cdr location)))
        (with-current-buffer (or (find-buffer-visiting file)
                                 (find-file-noselect file t))
          (save-excursion
            (save-restriction
              (widen)
              (goto-char pos)
              (if (org-at-heading-p)
                  (org-get-heading t t t t)
                (cadr (assoc "TITLE"
                             (org-collect-keywords '("TITLE"))))))))))))

(defun org-mdbook--html-id-link (link desc info)
  "Transcode an id: LINK to an HTML anchor pointing to <slug>.html.
Returns nil when LINK is not an id: link or the node cannot be found,
falling back to the default `org-html-link' behaviour."
  (when (string= (org-element-property :type link) "id")
    (let* ((id    (org-element-property :path link))
           (title (org-mdbook--get-node-title id)))
      (when title
        (format "<a href=\"%s.html\">%s</a>"
                (org-mdbook--title-to-slug title)
                (or desc (org-html-encode-plain-text title)))))))

(defvar org-mdbook--saved-settings nil
  "Saved org-html settings to restore after disabling org-mdbook.")

(defun org-mdbook--read-file (filename)
  "Read contents of FILENAME and return as string."
  (when (and filename (file-exists-p filename))
    (with-temp-buffer
      (insert-file-contents filename)
      (buffer-string))))

(defun org-mdbook--generate-head ()
  "Generate the HTML head content for mdBook theme."
  (let ((css-file (when org-mdbook-resources-dir
                    (expand-file-name "org-mdbook.css" org-mdbook-resources-dir)))
        (js-file (when org-mdbook-resources-dir
                   (expand-file-name "org-mdbook.js" org-mdbook-resources-dir))))
    (concat
     ;; Google Fonts (optional)
     (when org-mdbook-use-google-fonts
       "<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">
<link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>
<link href=\"https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600;700&family=Source+Code+Pro&display=swap\" rel=\"stylesheet\">\n")

     ;; FontAwesome 4.7 (used by mdBook for icons)
     "<link rel=\"stylesheet\" href=\"https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css\">\n"

     ;; CSS
     (if (and org-mdbook-embed-resources css-file (file-exists-p css-file))
         (concat "<style>\n" (org-mdbook--read-file css-file) "\n</style>\n")
       (if css-file
           "<link rel=\"stylesheet\" type=\"text/css\" href=\"org-mdbook.css\" />\n"
         ""))

     ;; JS
     (if (and org-mdbook-embed-resources js-file (file-exists-p js-file))
         (concat "<script>\n" (org-mdbook--read-file js-file) "\n</script>\n")
       (if js-file
           "<script src=\"org-mdbook.js\" defer></script>\n"
         "")))))

(defun org-mdbook-enable ()
  "Enable mdBook theme for all org HTML exports.
Call `org-mdbook-disable' to restore previous settings."
  (interactive)
  ;; Save current settings
  (setq org-mdbook--saved-settings
        (list :html-head org-html-head
              :html-head-extra org-html-head-extra
              :html-head-include-default-style org-html-head-include-default-style
              :html-doctype org-html-doctype
              :html-html5-fancy org-html-html5-fancy
              :html-validation-link org-html-validation-link))
  
  ;; Apply mdBook settings
  (setq org-html-head (org-mdbook--generate-head)
        org-html-head-extra ""
        org-html-head-include-default-style nil
        org-html-doctype "html5"
        org-html-html5-fancy t
        org-html-validation-link nil)
  
  (message "org-mdbook theme enabled for HTML exports"))

(defun org-mdbook-disable ()
  "Disable mdBook theme and restore previous settings."
  (interactive)
  (when org-mdbook--saved-settings
    (setq org-html-head (plist-get org-mdbook--saved-settings :html-head)
          org-html-head-extra (plist-get org-mdbook--saved-settings :html-head-extra)
          org-html-head-include-default-style (plist-get org-mdbook--saved-settings :html-head-include-default-style)
          org-html-doctype (plist-get org-mdbook--saved-settings :html-doctype)
          org-html-html5-fancy (plist-get org-mdbook--saved-settings :html-html5-fancy)
          org-html-validation-link (plist-get org-mdbook--saved-settings :html-validation-link))
    (setq org-mdbook--saved-settings nil)
    (message "org-mdbook theme disabled, settings restored")))

;;;###autoload
(defun org-mdbook-export-to-html (&optional async subtreep visible-only body-only ext-plist)
  "Export current buffer to HTML with mdBook theme.
Arguments ASYNC, SUBTREEP, VISIBLE-ONLY, BODY-ONLY, EXT-PLIST are 
passed to `org-html-export-to-html'."
  (interactive)
  (let ((org-html-head (org-mdbook--generate-head))
        (org-html-head-extra "")
        (org-html-head-include-default-style nil)
        (org-html-doctype "html5")
        (org-html-html5-fancy t)
        (org-html-validation-link nil))
    (advice-add 'org-html-link :before-until #'org-mdbook--html-id-link)
    (unwind-protect
        (org-html-export-to-html async subtreep visible-only body-only ext-plist)
      (advice-remove 'org-html-link #'org-mdbook--html-id-link))))

;;;###autoload
(defun org-mdbook-export-as-html (&optional async subtreep visible-only body-only ext-plist)
  "Export current buffer to an HTML buffer with mdBook theme.
Arguments ASYNC, SUBTREEP, VISIBLE-ONLY, BODY-ONLY, EXT-PLIST are 
passed to `org-html-export-as-html'."
  (interactive)
  (let ((org-html-head (org-mdbook--generate-head))
        (org-html-head-extra "")
        (org-html-head-include-default-style nil)
        (org-html-doctype "html5")
        (org-html-html5-fancy t)
        (org-html-validation-link nil))
    (advice-add 'org-html-link :before-until #'org-mdbook--html-id-link)
    (unwind-protect
        (org-html-export-as-html async subtreep visible-only body-only ext-plist)
      (advice-remove 'org-html-link #'org-mdbook--html-id-link))))

;;;###autoload
(defun org-mdbook-copy-resources (dest-dir)
  "Copy org-mdbook CSS and JS files to DEST-DIR.
Useful when not embedding resources in the HTML file."
  (interactive "DDestination directory: ")
  (unless org-mdbook-resources-dir
    (user-error "org-mdbook-resources-dir is not set"))
  (let ((css-src (expand-file-name "org-mdbook.css" org-mdbook-resources-dir))
        (js-src (expand-file-name "org-mdbook.js" org-mdbook-resources-dir))
        (css-dest (expand-file-name "org-mdbook.css" dest-dir))
        (js-dest (expand-file-name "org-mdbook.js" dest-dir)))
    (unless (file-exists-p css-src)
      (user-error "CSS file not found: %s" css-src))
    (unless (file-exists-p js-src)
      (user-error "JS file not found: %s" js-src))
    (copy-file css-src css-dest t)
    (copy-file js-src js-dest t)
    (message "Copied org-mdbook resources to %s" dest-dir)))

(provide 'org-mdbook)

;;; org-mdbook.el ends here
