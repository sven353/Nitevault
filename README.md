# Nitevault landing page

This folder has everything needed to put the concept-test page live: `index.html` (the whole site, one file, no build step) and `netlify.toml` (a couple of sane defaults for Netlify).

The waitlist form is already wired for Netlify Forms, so once this is deployed on Netlify, real email signups land in your Netlify dashboard with no extra backend to build.

## 1. Put it on GitHub

If this is a brand new repo:

```
cd path/to/this/folder
git init
git add .
git commit -m "Nitevault concept-test landing page"
```

Then create an empty repo on GitHub (github.com/new, no README or .gitignore so it stays empty), and push:

```
git remote add origin https://github.com/YOUR-USERNAME/nitevault-landing.git
git branch -M main
git push -u origin main
```

## 2. Deploy on Netlify

Two ways to do this, pick whichever suits how much you'll be iterating on the copy.

Connect the repo (recommended, since every future push updates the live site automatically):

1. In Netlify, click "Add new site" then "Import an existing project"
2. Choose GitHub and select the repo you just pushed
3. Build command: leave blank. Publish directory: `.` (this is already set in netlify.toml, so Netlify should pick it up on its own)
4. Click Deploy

Drag and drop (faster for a one-off, but you'll re-upload manually for every change):

1. In Netlify, go to "Sites" and drag the whole folder onto the drop zone
2. Netlify gives you a `something-random.netlify.app` URL right away

Either way, you'll land on a working `*.netlify.app` URL within a minute or two.

## 3. Turn on form notifications

Netlify Forms picks up the form automatically because it's a plain static HTML form with `data-netlify="true"` on it, no extra setup needed for it to start capturing submissions. To actually see them:

1. In the site's Netlify dashboard, go to Forms
2. You should see a form called "waitlist" once at least one person has submitted (or after the first deploy, Netlify scans the HTML and registers it even before any submissions)
3. Go to Site configuration > Forms > Form notifications, and add an email notification so signups land in your inbox instead of only sitting in the dashboard

A honeypot field is already built in for basic spam filtering, so you shouldn't need reCAPTCHA for a test like this.

## 4. Point nitevault.com at it

In Netlify, go to Domain management on the site, then add `nitevault.com` as a custom domain. Netlify will show you either:

- Nameservers to switch to at your domain registrar (Netlify DNS, simplest, Netlify manages everything), or
- A couple of DNS records to add at your current registrar if you'd rather keep DNS where it is

Either path, propagation is usually done within an hour, sometimes up to 24.

## Before you send traffic to it

A few things worth doing before this goes out to real people, none of them big:

- Add a real reply-to or forwarding address behind hello@nitevault.com in the footer, right now it's a placeholder
- Consider a one-line consent checkbox on the form ("I agree to receive early-access emails from Nitevault") since you're collecting emails from an EU audience. Not legally required to launch a test, but cheap to add now
- Swap in a real analytics snippet (Plausible, Fathom, or Netlify Analytics) if you want to see traffic sources, not just signup counts
- Decide your kill or go number for signups before you start driving traffic to it, so the result tells you something rather than getting rationalized after the fact
