XARV — STUDIO WEBSITE
=====================

WHAT IS INSIDE
- index.html        the homepage (services, case studies, reviews, process, about, FAQ, contact)
- privacy.html      privacy policy page
- thank-you.html    shown after a cart checkout on WhatsApp
- 404.html          custom not-found page
- content.json      ALL the words, prices, pictures, colors and settings.
                    The admin panel writes this same file.
- assets/           logo, portrait, cover image, site.css (design), site.js (engine)
- admin/            your private editing panel ( yourdomain.com/admin )
- api/save.js       publishes your edits to GitHub (runs on Vercel)
- vercel.json       hosting settings (clean URLs, caching, noindex for admin)
- robots.txt        search engine rules
- sitemap.xml       search engine sitemap

HOW TO PUBLISH THE FIRST TIME
Follow DEPLOY-ADMIN.txt (about 15 minutes, once). You end up with:
  yourdomain.com         the site
  yourdomain.com/admin   your editing panel (username + password, then Publish)

HOW TO EDIT LATER
Open yourdomain.com/admin, log in, change anything — every text in English
and Arabic, services, prices, photos, reviews, case studies, FAQs, colors,
Google Analytics ID — then press "Publish to my website". The change is
live for everyone in about 30 seconds.

Good to know
- "Preview draft" in the admin shows changes in YOUR browser only, before
  anyone else sees them. Publish makes them live for everyone.
- Services with an empty price show no price. Add one later in the admin.
- Services with an empty image show a gold letter tile. Add a photo path
  (assets/your-photo.jpg) later in the admin.
- The cart checkout sends the order to your WhatsApp and shows the
  thank-you page.
- Google Analytics: paste your GA4 Measurement ID (G-...) in the admin
  (General tab) and publish. Empty = no tracking.
- If your domain is not xarv.vercel.app, change "Site URL" in the admin
  (General tab) and publish — share links and search-engine data update.

CONTACT LINKS ALREADY SET UP
Email: jawadsheet27@gmail.com | WhatsApp/Phone: +961 81 191 013
