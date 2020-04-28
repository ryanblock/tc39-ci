const { join } = require('path');
const glob = require('glob').sync;
const tiny = require('tiny-json-http');
const fs = require('fs');
const { gzipSync } = require('zlib');

// ↓ put some files to publish in here
const dir = join(__dirname, '..', 'out');
const files = glob(join(dir, '**'), { nodir: true });

async function go () {
	const data = {
		pr: 9001, // Even testing values should be OVER 9000!!!
		sha: 'c0a4289e43fb2e68c722a1e9c9b2b13b7058f754', // Also just for testing
		files: []
	};
	for (const file of files) {
		const filename = file.replace(dir, '').substr(1);
		const contents = fs.readFileSync(file);
		const body = gzipSync(contents).toString('base64');
		console.log(`Publishing: ${filename} (${body.length / 1000}KB)`);
		data.files.push({
			filename,
			body,
		});
	}
	const url = 'http://localhost:3333/preview/tc39/ecma262';
	// const url = 'https://river-xt6-staging.begin.app/preview/tc39/ecma262';

	const payloadSize = JSON.stringify(data).length;
	console.log(`Payload size: ${payloadSize / 1000}KB`);
	if (payloadSize >= 1000 * 1000 * 6) {
		throw Error('Payloads must be under 6MB');
	}

  const token = process.env.CI_PREVIEW_TOKEN ? process.env.CI_PREVIEW_TOKEN : '';
	const bearerToken = new Buffer.from(token).toString('base64');
	const headers = {
		authorization: `Bearer ${bearerToken}`
	};
	await tiny.post({ url, data, headers });
}
go().catch((err) => {
	console.error(err);
	process.exitCode = 1;
});