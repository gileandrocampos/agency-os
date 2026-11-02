import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const forbiddenResidues = [
	'safe-crawl',
	'src/config.ts',
	'src/crawl-site.usecase.ts',
	'docs/crawler.md',
	'docs/page-preparation.md',
	'docs/queue.md',
	'instructions-map',
	'@workspace',
];

const failures = [];

function fail(check, details) {
	failures.push({ check, details });
}

function readText(relPath) {
	return fs.readFileSync(path.join(root, relPath), 'utf8');
}

function listFilesRecursive(absDir) {
	const out = [];
	const stack = [absDir];
	while (stack.length > 0) {
		const current = stack.pop();
		const entries = fs.readdirSync(current, { withFileTypes: true });
		for (const entry of entries) {
			const abs = path.join(current, entry.name);
			if (entry.isDirectory()) {
				stack.push(abs);
			} else if (entry.isFile()) {
				out.push(abs);
			}
		}
	}
	return out;
}

function toRelPosix(absPath) {
	return path.relative(root, absPath).split(path.sep).join('/');
}

function globToRegex(glob) {
	let out = '^';
	for (let i = 0; i < glob.length; i++) {
		const ch = glob[i];
		const next = glob[i + 1];
		if (ch === '*') {
			if (next === '*') {
				out += '.*';
				i++;
			} else {
				out += '[^/]*';
			}
		} else {
			if ('\\^$+?.()|{}[]'.includes(ch)) out += `\\${ch}`;
			else out += ch;
		}
	}
	out += '$';
	return new RegExp(out);
}

function extractFrontmatterValue(text, key) {
	const match = text.match(new RegExp(`^${key}:\\s*"([^"]*)"`, 'm'));
	return match ? match[1] : '';
}

function checkCopilotLineLimit() {
	const rel = '.github/copilot-instructions.md';
	const lines = readText(rel).split(/\r?\n/).length;
	if (lines > 60) {
		fail('copilot-line-limit', `${rel} has ${lines} lines (>60)`);
	}
}

function checkInstructions() {
	const instDir = path.join(root, '.github', 'instructions');
	const files = fs.readdirSync(instDir, { withFileTypes: true })
		.filter((d) => d.isFile())
		.map((d) => d.name);

	const nonInstruction = files.filter((name) => !name.endsWith('.instructions.md'));
	if (nonInstruction.length > 0) {
		fail('instructions-only-pattern', `Non .instructions.md files: ${nonInstruction.join(', ')}`);
	}

	const srcFiles = listFilesRecursive(path.join(root, 'src')).map(toRelPosix);
	const allApplyTo = [];

	for (const fileName of files.filter((n) => n.endsWith('.instructions.md'))) {
		const rel = `.github/instructions/${fileName}`;
		const text = readText(rel);
		const lines = text.split(/\r?\n/).length;
		if (lines > 40) {
			fail('instruction-line-limit', `${rel} has ${lines} lines (>40)`);
		}

		const hasDescription = /^description:\s*.+/m.test(text);
		if (!hasDescription) {
			fail('instruction-description', `${rel} missing description in frontmatter`);
		}

		const applyTo = extractFrontmatterValue(text, 'applyTo');
		if (!applyTo) {
			fail('instruction-applyto', `${rel} missing applyTo in frontmatter`);
			continue;
		}

		const globs = applyTo.split(',').map((s) => s.trim()).filter(Boolean);
		if (globs.length === 0) {
			fail('instruction-applyto', `${rel} has empty applyTo`);
			continue;
		}

		for (const g of globs) {
			if (g === '**' || g === '**/*') {
				fail('instruction-root-glob', `${rel} has forbidden root glob: ${g}`);
			}

			const rx = globToRegex(g);
			const matches = srcFiles.filter((p) => rx.test(p));
			if (matches.length === 0) {
				fail('instruction-glob-match', `${rel} glob has no matches: ${g}`);
			}
			allApplyTo.push({ file: rel, glob: g, regex: rx });
		}
	}

	return allApplyTo;
}

function parseMapRows(copilotText) {
	const rows = [];
	const lines = copilotText.split(/\r?\n/);
	for (const line of lines) {
		if (!line.startsWith('| ')) continue;
		if (line.includes('|---|')) continue;
		const parts = line.split('|').map((p) => p.trim());
		if (parts.length < 6) continue;
		const pathCol = parts[2] || '';
		const docCol = parts[4] || '';
		if (pathCol === 'caminho') continue;

		const pathGlobs = [...pathCol.matchAll(/`([^`]+)`/g)].map((m) => m[1]);
		const docPaths = [...docCol.matchAll(/`([^`]+)`/g)].map((m) => m[1]);
		rows.push({ line, pathGlobs, docPaths });
	}
	return rows;
}

function checkSrcCoverage(applyToItems) {
	const srcRoot = path.join(root, 'src');
	const srcDirs = fs.readdirSync(srcRoot, { withFileTypes: true })
		.filter((d) => d.isDirectory())
		.map((d) => d.name)
		.sort();

	const allSrcFiles = listFilesRecursive(srcRoot).map(toRelPosix);
	const copilotText = readText('.github/copilot-instructions.md');
	const docsIndexText = readText('docs/README.md');
	const mapRows = parseMapRows(copilotText);

	for (const dirName of srcDirs) {
		const dirPrefix = `src/${dirName}/`;
		const filesInDir = allSrcFiles.filter((p) => p.startsWith(dirPrefix));

		const coveredByApplyTo = applyToItems.some((item) => filesInDir.some((p) => item.regex.test(p)));
		if (!coveredByApplyTo) {
			fail('src-coverage-applyto', `src/${dirName} not covered by any applyTo glob`);
		}

		const mapRow = mapRows.find((row) => row.pathGlobs.some((g) => g === `src/${dirName}/**`));
		if (!mapRow) {
			fail('src-coverage-map', `src/${dirName} missing in .github/copilot-instructions.md map`);
			continue;
		}

		let docMappedInIndex = false;
		for (const docPath of mapRow.docPaths) {
			if (!fs.existsSync(path.join(root, docPath))) {
				fail('map-doc-path-exists', `Map doc path does not exist for src/${dirName}: ${docPath}`);
				continue;
			}
			const normalizedDoc = docPath.replace(/^docs\//, './');
			if (docsIndexText.includes(docPath) || docsIndexText.includes(normalizedDoc)) {
				docMappedInIndex = true;
			}
		}

		if (!docMappedInIndex) {
			fail('src-coverage-docs-index', `src/${dirName} map doc is not referenced in docs/README.md`);
		}
	}
}

function checkDocsSummaryBlock() {
	const docsRoot = path.join(root, 'docs');
	const files = listFilesRecursive(docsRoot)
		.filter((abs) => abs.endsWith('.md'))
		.filter((abs) => !toRelPosix(abs).startsWith('docs/_templates/'));

	for (const abs of files) {
		const rel = toRelPosix(abs);
		const text = fs.readFileSync(abs, 'utf8');
		const lines = text.split(/\r?\n/);

		let firstH2 = lines.findIndex((l) => /^##\s+/.test(l));
		if (firstH2 === -1) firstH2 = lines.length;

		const head = lines.slice(0, firstH2).join('\n');
		const hasSummary = />\s*\*\*Resumo\*\*/.test(head);
		if (!hasSummary) {
			fail('docs-summary-block', `${rel} missing > **Resumo** before first ##`);
		}
	}
}

function isLikelyRelativePath(token) {
	if (!token) return false;
	if (/^(https?:|mailto:)/i.test(token)) return false;
	if (token.startsWith('#')) return false;
	if (token.includes('<') || token.includes('>')) return false;
	const allowedStarts = [
		'src/',
		'docs/',
		'.github/',
		'scripts/',
		'data/',
		'output/',
		'./',
		'../',
	];

	const allowedExact = [
		'package.json',
		'tsconfig.json',
		'vitest.config.ts',
		'README.md',
		'CHANGELOG.md',
		'config.json',
	];

	if (allowedExact.includes(token)) return true;
	if (!allowedStarts.some((p) => token.startsWith(p))) return false;
	if (/\s/.test(token)) return false;
	return true;
}

function normalizePathToken(raw) {
	let token = raw.trim();
	token = token.replace(/[),.;:!?]+$/, '');
	token = token.replace(/^\.?\//, '');
	return token;
}

function checkPathExistsFromToken(rawToken) {
	const token = normalizePathToken(rawToken);
	if (!isLikelyRelativePath(token)) return true;
	if (token.startsWith('data/') || token.startsWith('output/')) return true;

	let candidate = token;
	if (candidate.includes('*')) {
		candidate = candidate.slice(0, candidate.indexOf('*'));
	}
	candidate = candidate.replace(/\\/g, '/').replace(/\/+$/, '');
	if (!candidate) return true;

	const abs = path.join(root, candidate);
	return fs.existsSync(abs);
}

function checkLinksAndBackticksAndResidues() {
	const mdFiles = [
		...listFilesRecursive(path.join(root, '.github')).filter((p) => p.endsWith('.md')),
		...listFilesRecursive(path.join(root, 'docs')).filter((p) => p.endsWith('.md')),
	].filter((p) => toRelPosix(p) !== '.github/_handoff.md');

	const packageJson = JSON.parse(readText('package.json'));
	const scriptNames = new Set(Object.keys(packageJson.scripts || {}));

	for (const abs of mdFiles) {
		const rel = toRelPosix(abs);
		const text = fs.readFileSync(abs, 'utf8');
		const lines = text.split(/\r?\n/);

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			const lineNo = i + 1;

			for (const residue of forbiddenResidues) {
				if (line.includes(residue)) {
					fail('forbidden-residue', `${rel}:${lineNo} contains ${residue}`);
				}
			}

			const runMatches = [...line.matchAll(/npm\s+run\s+([a-zA-Z0-9:_-]+)/g)];
			for (const m of runMatches) {
				const cmd = m[1];
				if (!scriptNames.has(cmd)) {
					fail('npm-run-script-exists', `${rel}:${lineNo} references missing script: npm run ${cmd}`);
				}
			}

			const linkMatches = [...line.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)];
			for (const lm of linkMatches) {
				const target = lm[1].trim();
				if (/^(https?:|mailto:)/i.test(target) || target.startsWith('#')) continue;
				const withoutAnchor = target.split('#')[0];
				if (!withoutAnchor || withoutAnchor === '.') continue;

				const normalized = normalizePathToken(withoutAnchor);
				const resolved = path.resolve(path.dirname(abs), normalized);
				if (!fs.existsSync(resolved)) {
					fail('markdown-link-exists', `${rel}:${lineNo} broken relative link: ${target}`);
				}
			}

			const backtickMatches = [...line.matchAll(/`([^`]+)`/g)];
			for (const bm of backtickMatches) {
				const token = bm[1];
				if (!checkPathExistsFromToken(token)) {
					fail('backticked-path-exists', `${rel}:${lineNo} path not found: ${token}`);
				}
			}
		}
	}
}

function main() {
	checkCopilotLineLimit();
	const applyToItems = checkInstructions();
	checkSrcCoverage(applyToItems);
	checkDocsSummaryBlock();
	checkLinksAndBackticksAndResidues();

	if (failures.length > 0) {
		console.log('FAIL');
		for (const f of failures) {
			console.log(`- [${f.check}] ${f.details}`);
		}
		process.exit(1);
	}

	console.log('PASS check-context');
}

main();
