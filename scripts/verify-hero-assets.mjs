import { verifyHeroPack } from './hero-asset-pipeline.mjs';

const result = await verifyHeroPack();

console.log(`Hero pack verify: variant=${result.variant} stage=${result.stage} manifest=${result.manifestMatches ? 'match' : 'mismatch'}`);
for (const [toolId, tool] of Object.entries(result.toolResults)) {
  console.log(`- ${toolId}: ${tool.fileMatches ? 'match' : 'mismatch'} ${tool.actualSha256.slice(0, 12) || 'missing'}...`);
}

if (!result.ok) {
  process.exitCode = 1;
}
