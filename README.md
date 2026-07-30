# Portfolio — Wojciech Spychała

Personal portfolio website. Static HTML/CSS, no build step.

## Stack

- Plain HTML5 + CSS3, no framework, no dependencies
- Hosted on mikr.us VPS (`ivy202-44591.mikrus.cloud`)

## Structure

```
repo/
├── index.html
├── style.css
└── README.md
```

## Local development

Open `index.html` directly in a browser, or serve it locally:

```bash
python -m http.server 8000
```

## Deploy

Copy files to the mikr.us server via SSH/SCP into the web root served by the
site's web server (nginx/Apache).
