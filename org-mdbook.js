// org-mdbook.js - Transform org-mode HTML export to mdBook-style layout
// Handles various org-mode export configurations

(function() {
  'use strict';

  // Section headings for prev/next navigation
  var sections = [];
  var currentSectionIndex = -1;

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    try {
      var title = getDocumentTitle();
      var tocData = extractTOC();
      var contentData = extractContent();

      createMdBookStructure(title, tocData, contentData);

      initSidebarToggle();
      initThemeSwitcher();
      initTocHighlight();
      initNavChapters();
      initKeyboardShortcuts();
    } catch (e) {
      console.error('org-mdbook initialization error:', e);
    }
  }

  function getDocumentTitle() {
    var title = '';

    // 1. h1.title
    var h1Title = document.querySelector('h1.title');
    if (h1Title) {
      title = h1Title.textContent.trim();
    }

    // 2. #title element
    if (!title) {
      var titleEl = document.getElementById('title');
      if (titleEl) {
        title = titleEl.textContent.trim();
      }
    }

    // 3. First h1
    if (!title) {
      var firstH1 = document.querySelector('h1');
      if (firstH1) {
        title = firstH1.textContent.trim();
      }
    }

    // 4. document.title
    if (!title) {
      title = document.title || 'Documentation';
    }

    return title;
  }

  function extractTOC() {
    var tocHtml = '';

    // Try various TOC locations
    var tocContainers = [
      '#table-of-contents #text-table-of-contents > ul',
      '#table-of-contents ul',
      '#text-table-of-contents > ul',
      '#text-table-of-contents ul',
      'nav#table-of-contents ul',
      '#toc ul',
      '.toc ul'
    ];

    for (var i = 0; i < tocContainers.length; i++) {
      var toc = document.querySelector(tocContainers[i]);
      if (toc) {
        tocHtml = toc.innerHTML;
        break;
      }
    }

    // If still no TOC, try to build one from headings
    if (!tocHtml) {
      tocHtml = buildTocFromHeadings();
    }

    return tocHtml;
  }

  function buildTocFromHeadings() {
    var headings = document.querySelectorAll('h2, h3, h4');
    if (headings.length === 0) return '';

    var html = '';
    for (var i = 0; i < headings.length; i++) {
      var h = headings[i];
      var id = h.id;

      // Try to find ID from anchor inside heading
      if (!id) {
        var anchor = h.querySelector('a[id]');
        if (anchor) {
          id = anchor.id;
        }
      }

      // Generate an ID if none exists
      if (!id) {
        id = h.textContent.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        h.id = id;
      }

      var text = h.textContent.replace(/^[\d\.]+ /, ''); // Remove section numbers
      var level = parseInt(h.tagName.charAt(1));
      var indent = level - 2;

      var paddingStyle = indent > 0 ? ' style="padding-left: ' + (indent * 20) + 'px"' : '';
      html += '<li' + paddingStyle + '><a href="#' + id + '">' + escapeHtml(text) + '</a></li>';
    }

    return html;
  }

  function extractContent() {
    var content = '';

    // Try to get content from #content div
    var contentEl = document.getElementById('content');
    if (contentEl) {
      content = contentEl.innerHTML;
    } else {
      // Get everything in body except known non-content elements
      var body = document.body.cloneNode(true);

      // Remove elements we don't want
      var removeSelectors = [
        '#table-of-contents',
        '#postamble',
        '#preamble',
        'script',
        'style',
        'nav',
        '.sidebar',
        '.menu-bar'
      ];

      for (var i = 0; i < removeSelectors.length; i++) {
        var elements = body.querySelectorAll(removeSelectors[i]);
        for (var j = 0; j < elements.length; j++) {
          elements[j].parentNode.removeChild(elements[j]);
        }
      }

      content = body.innerHTML;
    }

    return content;
  }

  function createMdBookStructure(title, tocHtml, contentHtml) {
    var html = document.documentElement;
    var body = document.body;

    // Apply saved theme immediately to minimize flash
    var savedTheme = 'ayu';
    try { savedTheme = localStorage.getItem('org-mdbook-theme') || 'ayu'; } catch (e) {}
    html.classList.add(savedTheme);

    // Set sidebar state on <html> (matching mdBook)
    if (window.innerWidth >= 1080) {
      var savedSidebar = 'visible';
      try { savedSidebar = localStorage.getItem('org-mdbook-sidebar') || 'visible'; } catch (e) {}
      html.classList.add('sidebar-' + savedSidebar);
    } else {
      html.classList.add('sidebar-hidden');
    }

    // Build mdBook-compatible HTML structure
    body.innerHTML =
      // Sidebar
      '<nav id="sidebar" class="sidebar" aria-label="Table of contents">' +
        '<div class="sidebar-scrollbox">' +
          '<div class="sidebar-title"><a href="#">' + escapeHtml(title) + '</a></div>' +
          '<ol class="chapter">' + tocHtml + '</ol>' +
        '</div>' +
      '</nav>' +

      // Page wrapper
      '<div id="page-wrapper" class="page-wrapper">' +
        // Menu bar
        '<div class="menu-bar">' +
          '<div class="left-buttons">' +
            '<button class="icon-button" id="sidebar-toggle" title="Toggle Table of Contents" aria-label="Toggle Table of Contents" aria-controls="sidebar">' +
              '<i class="fa fa-bars"></i>' +
            '</button>' +
            '<button class="icon-button" id="theme-toggle" title="Change theme" aria-label="Change theme" aria-haspopup="true" aria-expanded="false" aria-controls="theme-list">' +
              '<i class="fa fa-paint-brush"></i>' +
            '</button>' +
            '<ul id="theme-list" class="theme-popup" aria-label="Themes" role="menu">' +
              '<li role="none"><button role="menuitem" class="theme" id="light">Light</button></li>' +
              '<li role="none"><button role="menuitem" class="theme" id="rust">Rust</button></li>' +
              '<li role="none"><button role="menuitem" class="theme" id="coal">Coal</button></li>' +
              '<li role="none"><button role="menuitem" class="theme" id="navy">Navy</button></li>' +
              '<li role="none"><button role="menuitem" class="theme" id="ayu">Ayu</button></li>' +
            '</ul>' +
          '</div>' +
          '<h1 class="menu-title">' + escapeHtml(title) + '</h1>' +
          '<div class="right-buttons"></div>' +
        '</div>' +

        // Content
        '<div id="content" class="content">' +
          '<main>' +
            contentHtml +
          '</main>' +

          // Nav chapters (prev/next section arrows)
          '<nav class="nav-wrapper" aria-label="Page navigation">' +
            '<a class="nav-chapters previous" id="nav-prev" title="Previous section" aria-label="Previous section" aria-keyshortcuts="Left">' +
              '<svg viewBox="0 0 20 20" width="20" height="20"><path d="M14 3l-8 7 8 7" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
            '</a>' +
            '<a class="nav-chapters next" id="nav-next" title="Next section" aria-label="Next section" aria-keyshortcuts="Right">' +
              '<svg viewBox="0 0 20 20" width="20" height="20"><path d="M6 3l8 7-8 7" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
            '</a>' +
          '</nav>' +
        '</div>' +
      '</div>';

    // Clean up the content - remove duplicate titles
    var contentArea = document.querySelector('.content main');
    if (contentArea) {
      var firstTitle = contentArea.querySelector('h1.title');
      if (firstTitle) {
        firstTitle.parentNode.removeChild(firstTitle);
      }
    }
  }

  function initSidebarToggle() {
    var toggle = document.getElementById('sidebar-toggle');
    if (!toggle) return;

    toggle.addEventListener('click', function(e) {
      e.preventDefault();
      toggleSidebar();
    });

    // Close sidebar when clicking overlay on mobile
    document.addEventListener('click', function(e) {
      if (window.innerWidth < 1080 &&
          document.documentElement.classList.contains('sidebar-visible') &&
          !e.target.closest('.sidebar') &&
          !e.target.closest('#sidebar-toggle')) {
        document.documentElement.classList.remove('sidebar-visible');
        document.documentElement.classList.add('sidebar-hidden');
        saveSidebarState();
      }
    });
  }

  function toggleSidebar() {
    var html = document.documentElement;
    if (html.classList.contains('sidebar-visible')) {
      html.classList.remove('sidebar-visible');
      html.classList.add('sidebar-hidden');
    } else {
      html.classList.remove('sidebar-hidden');
      html.classList.add('sidebar-visible');
    }
    saveSidebarState();
  }

  function initThemeSwitcher() {
    var themeToggle = document.getElementById('theme-toggle');
    var themePopup = document.getElementById('theme-list');
    if (!themeToggle || !themePopup) return;

    themeToggle.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      themePopup.classList.toggle('show');
    });

    // Theme buttons
    var themeButtons = themePopup.querySelectorAll('.theme');
    for (var i = 0; i < themeButtons.length; i++) {
      themeButtons[i].addEventListener('click', function(e) {
        e.preventDefault();
        setTheme(this.id);
        themePopup.classList.remove('show');
      });
    }

    // Close popup when clicking outside
    document.addEventListener('click', function(e) {
      if (!e.target.closest('#theme-toggle') && !e.target.closest('#theme-list')) {
        themePopup.classList.remove('show');
      }
    });
  }

  function setTheme(theme) {
    var html = document.documentElement;
    html.classList.remove('light', 'rust', 'coal', 'navy', 'ayu');
    html.classList.add(theme);
    try {
      localStorage.setItem('org-mdbook-theme', theme);
    } catch (e) {}
  }

  function saveSidebarState() {
    try {
      var isHidden = document.documentElement.classList.contains('sidebar-hidden');
      localStorage.setItem('org-mdbook-sidebar', isHidden ? 'hidden' : 'visible');
    } catch (e) {}
  }

  function initTocHighlight() {
    var tocLinks = document.querySelectorAll('.sidebar .chapter a');
    if (tocLinks.length === 0) return;

    var headings = [];
    for (var i = 0; i < tocLinks.length; i++) {
      var link = tocLinks[i];
      var href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        var id = href.slice(1);
        var heading = document.getElementById(id);
        if (heading) {
          headings.push({ el: heading, link: link });
        }
      }
    }

    if (headings.length === 0) return;

    function updateHighlight() {
      var scrollTop = window.scrollY + 100;
      var current = null;

      for (var i = 0; i < headings.length; i++) {
        if (headings[i].el.offsetTop <= scrollTop) {
          current = headings[i];
        } else {
          break;
        }
      }

      for (var i = 0; i < tocLinks.length; i++) {
        tocLinks[i].classList.remove('active');
        if (tocLinks[i].parentElement) {
          tocLinks[i].parentElement.classList.remove('active');
        }
      }

      if (current) {
        current.link.classList.add('active');
        if (current.link.parentElement) {
          current.link.parentElement.classList.add('active');
        }
      }
    }

    var ticking = false;
    window.addEventListener('scroll', function() {
      if (!ticking) {
        requestAnimationFrame(function() {
          updateHighlight();
          ticking = false;
        });
        ticking = true;
      }
    });

    updateHighlight();
  }

  function initNavChapters() {
    // Collect h2-level section headings for prev/next navigation
    var h2s = document.querySelectorAll('.content main h2');
    sections = [];
    for (var i = 0; i < h2s.length; i++) {
      if (h2s[i].id) {
        sections.push(h2s[i]);
      }
    }

    var prevBtn = document.getElementById('nav-prev');
    var nextBtn = document.getElementById('nav-next');
    if (!prevBtn || !nextBtn) return;

    // Update visibility based on scroll position
    function updateNavVisibility() {
      var scrollTop = window.scrollY + 150;
      currentSectionIndex = -1;

      for (var i = 0; i < sections.length; i++) {
        if (sections[i].offsetTop <= scrollTop) {
          currentSectionIndex = i;
        } else {
          break;
        }
      }

      // Show/hide prev button
      if (currentSectionIndex <= 0 && scrollTop < (sections.length > 0 ? sections[0].offsetTop : Infinity)) {
        prevBtn.style.visibility = 'hidden';
      } else {
        prevBtn.style.visibility = 'visible';
      }

      // Show/hide next button
      if (currentSectionIndex >= sections.length - 1) {
        nextBtn.style.visibility = 'hidden';
      } else {
        nextBtn.style.visibility = 'visible';
      }
    }

    prevBtn.addEventListener('click', function(e) {
      e.preventDefault();
      navigateSection(-1);
    });

    nextBtn.addEventListener('click', function(e) {
      e.preventDefault();
      navigateSection(1);
    });

    // Throttled scroll listener
    var navTicking = false;
    window.addEventListener('scroll', function() {
      if (!navTicking) {
        requestAnimationFrame(function() {
          updateNavVisibility();
          navTicking = false;
        });
        navTicking = true;
      }
    });

    updateNavVisibility();
  }

  function navigateSection(direction) {
    if (sections.length === 0) return;

    var targetIndex = currentSectionIndex + direction;

    // Going backward from before first section -> scroll to top
    if (targetIndex < 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Clamp to valid range
    if (targetIndex >= sections.length) return;

    var target = sections[targetIndex];
    if (target) {
      // Offset by the menu bar height so heading is visible below the sticky bar
      var menuBarHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--menu-bar-height')) || 50;
      var targetTop = target.getBoundingClientRect().top + window.scrollY - menuBarHeight - 8;
      window.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
    }
  }

  function initKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.key) {
        case 's':
          toggleSidebar();
          e.preventDefault();
          break;
        case 't':
          var popup = document.getElementById('theme-list');
          if (popup) popup.classList.toggle('show');
          e.preventDefault();
          break;
        case 'Escape':
          var popup = document.getElementById('theme-list');
          if (popup) popup.classList.remove('show');
          break;
        case 'ArrowLeft':
          navigateSection(-1);
          e.preventDefault();
          break;
        case 'ArrowRight':
          navigateSection(1);
          e.preventDefault();
          break;
      }
    });
  }

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

})();
