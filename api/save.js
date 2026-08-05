/* ============================================================
   PUBLISH ENDPOINT  ->  /api/save

   The /admin page sends your edits here. This file checks the
   password, then writes content.json (and any pictures or videos
   you uploaded) into your GitHub repository. Your host sees the
   new commit and rebuilds the site automatically.

   It needs 4 environment variables, set in your host's dashboard:
     ADMIN_PASSWORD  - the password you type on the /admin page
     GITHUB_TOKEN    - a GitHub token with "Contents: read and write"
     GITHUB_REPO     - your repo, written as  username/repository
     GITHUB_BRANCH   - optional, defaults to main

   Nothing secret is ever sent to the browser.
   ============================================================ */

const crypto = require('crypto')

const MAX_UPLOADS = 12
const MAX_UPLOAD_BYTES = 4.6 * 1024 * 1024
const SAFE_PATH = /^assets\/[A-Za-z0-9][A-Za-z0-9._\/-]{0,120}$/

function sameSecret(a, b) {
	const x = Buffer.from(String(a))
	const y = Buffer.from(String(b))
	if (x.length !== y.length) return false
	return crypto.timingSafeEqual(x, y)
}

async function gh(path, token, options = {}) {
	const res = await fetch('https://api.github.com' + path, {
		...options,
		headers: {
			Authorization: 'Bearer ' + token,
			Accept: 'application/vnd.github+json',
			'X-GitHub-Api-Version': '2022-11-28',
			'User-Agent': 'jawad-portfolio-admin',
			...(options.body ? { 'Content-Type': 'application/json' } : {}),
		},
	})
	const text = await res.text()
	let body = null
	try {
		body = text ? JSON.parse(text) : null
	} catch (e) {
		body = { raw: text }
	}
	return { status: res.status, body }
}

async function putFile({ repo, branch, token, path, contentBase64, message }) {
	const existing = await gh(
		`/repos/${repo}/contents/${encodeURI(path)}?ref=${encodeURIComponent(branch)}`,
		token
	)
	const sha = existing.status === 200 && existing.body && existing.body.sha ? existing.body.sha : undefined

	const res = await gh(`/repos/${repo}/contents/${encodeURI(path)}`, token, {
		method: 'PUT',
		body: JSON.stringify({
			message,
			content: contentBase64,
			branch,
			...(sha ? { sha } : {}),
		}),
	})
	if (res.status !== 200 && res.status !== 201) {
		const why = (res.body && (res.body.message || res.body.raw)) || 'unknown error'
		throw new Error(`GitHub refused to write ${path}: ${why}`)
	}
	return path
}

async function handle(req, res) {
	const send = (code, obj) => {
		res.statusCode = code
		res.setHeader('Content-Type', 'application/json')
		res.setHeader('Cache-Control', 'no-store')
		res.end(JSON.stringify(obj))
	}

	if (req.method === 'OPTIONS') {
		res.statusCode = 204
		res.setHeader('Allow', 'POST, OPTIONS')
		return res.end()
	}
	if (req.method !== 'POST') return send(405, { error: 'Use POST.' })

	const PASSWORD = process.env.ADMIN_PASSWORD
	const TOKEN = process.env.GITHUB_TOKEN
	const REPO = process.env.GITHUB_REPO
	const BRANCH = process.env.GITHUB_BRANCH || 'main'

	if (!PASSWORD || !TOKEN || !REPO) {
		return send(500, {
			error:
				'This site is missing its settings. In your hosting dashboard add ADMIN_PASSWORD, GITHUB_TOKEN and GITHUB_REPO, then redeploy. See DEPLOY-ADMIN.txt.',
		})
	}

	let body = req.body
	if (!body || typeof body === 'string') {
		try {
			if (typeof body === 'string') {
				body = JSON.parse(body)
			} else {
				const chunks = []
				for await (const c of req) chunks.push(c)
				body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
			}
		} catch (e) {
			return send(400, { error: 'Could not read the request.' })
		}
	}

	if (!body.password || !sameSecret(body.password, PASSWORD)) {
		return send(401, { error: 'Wrong password.' })
	}
	if (body.action === 'auth') return send(200, { ok: true })

	const content = body.content
	if (!content || typeof content !== 'object' || Array.isArray(content)) {
		return send(400, { error: 'No content was sent.' })
	}
	if (!content.contact || !content.projects) {
		return send(400, { error: 'That content does not look like the portfolio file. Nothing was changed.' })
	}

	const uploads = Array.isArray(body.uploads) ? body.uploads : []
	if (uploads.length > MAX_UPLOADS) {
		return send(400, { error: `Too many files at once (max ${MAX_UPLOADS}). Publish in smaller batches.` })
	}
	for (const u of uploads) {
		if (!u || typeof u.path !== 'string' || typeof u.base64 !== 'string') {
			return send(400, { error: 'One of the uploaded files was malformed.' })
		}
		if (!SAFE_PATH.test(u.path) || u.path.includes('..')) {
			return send(400, { error: `Unsafe file name: ${u.path}` })
		}
		if (u.base64.length * 0.75 > MAX_UPLOAD_BYTES) {
			return send(400, { error: `${u.path} is too large to publish this way.` })
		}
	}

	try {
		const written = []
		for (const u of uploads) {
			written.push(
				await putFile({
					repo: REPO,
					branch: BRANCH,
					token: TOKEN,
					path: u.path,
					contentBase64: u.base64,
					message: `admin: upload ${u.path}`,
				})
			)
		}

		const json = JSON.stringify(content, null, 2) + '\n'
		written.push(
			await putFile({
				repo: REPO,
				branch: BRANCH,
				token: TOKEN,
				path: 'content.json',
				contentBase64: Buffer.from(json, 'utf8').toString('base64'),
				message: 'admin: update site content',
			})
		)

		return send(200, { ok: true, written })
	} catch (err) {
		return send(502, { error: err.message })
	}
}

module.exports = handle
module.exports.default = handle
