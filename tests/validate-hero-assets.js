const path = require('path');
const { pathToFileURL } = require('url');

const EXPECTED_ASSET_SET_VERSION = 'hero-pack-v5';
const EXPECTED_CONTRACT_VERSION = 'hero-asset-contract-v4';
const EXPECTED_BUILD_STAGE = 'assembly-orbit-bespoke-pack';
const EXPECTED_PROVENANCE = 'bespoke-authored';

(async () => {
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║      Hero Asset Pipeline Verification   ║');
  console.log('╚══════════════════════════════════════════╝\n');

  const pipelinePath = pathToFileURL(path.resolve(__dirname, '..', 'scripts', 'hero-asset-pipeline.mjs')).href;
  const { verifyHeroPack } = await import(pipelinePath);
  const result = await verifyHeroPack();

  const checks = [];
  const record = (name, pass, detail = '') => {
    checks.push({ name, pass, detail });
    console.log(`  ${pass ? '✓ PASS' : '✗ FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
  };

  const toolIds = Object.keys(result.toolResults || {});
  const allFilesMatch = toolIds.every((toolId) => result.toolResults[toolId]?.fileMatches === true);
  const wrench = result.manifest?.tools?.wrench || {};
  const hammer = result.manifest?.tools?.hammer || {};
  const saw = result.manifest?.tools?.saw || {};
  const allBespokeAuthored = [hammer, wrench, saw].every((tool) => (
    tool.provenance === EXPECTED_PROVENANCE
    && typeof tool.sourceUrl === 'string'
    && tool.sourceUrl.length > 0
    && typeof tool.license === 'string'
    && tool.license.length > 0
    && typeof tool.attribution === 'string'
    && tool.attribution.length > 0
    && typeof tool.processedFrom === 'string'
    && tool.processedFrom.length > 0
  ));

  record('Hero asset files match deterministic pipeline output', allFilesMatch, JSON.stringify(result.toolResults));
  record('Manifest matches regenerated pack', result.manifestMatches === true, `stage=${result.stage} variant=${result.variant}`);
  record(
    'Hero pack reports the bespoke assembly orbit stage',
    result.stage === EXPECTED_BUILD_STAGE,
    result.stage
  );
  record(
    'Hero pack reports the new bespoke asset contract',
    result.manifest?.assetSetVersion === EXPECTED_ASSET_SET_VERSION
      && result.manifest?.contractVersion === EXPECTED_CONTRACT_VERSION,
    `assetSet=${result.manifest?.assetSetVersion} contract=${result.manifest?.contractVersion}`
  );
  record('Hero pack reports final variant', result.variant === 'final', result.variant);
  record(
    'Primary wrench is bespoke-authored with final-runtime metadata',
    wrench.provenance === EXPECTED_PROVENANCE
      && wrench.heroRole === 'primary'
      && wrench.status === 'final-runtime',
    JSON.stringify(wrench)
  );
  record(
    'Support props are bespoke-authored support assets',
    hammer.provenance === EXPECTED_PROVENANCE
      && hammer.heroRole === 'support'
      && hammer.status === 'support-runtime'
      && saw.provenance === EXPECTED_PROVENANCE
      && saw.heroRole === 'support'
      && saw.status === 'support-runtime',
    JSON.stringify({ hammer, saw })
  );
  record(
    'All shipped hero tools carry bespoke asset lineage metadata',
    allBespokeAuthored,
    JSON.stringify({
      hammer: { sourceUrl: hammer.sourceUrl, license: hammer.license, processedFrom: hammer.processedFrom },
      wrench: { sourceUrl: wrench.sourceUrl, license: wrench.license, processedFrom: wrench.processedFrom },
      saw: { sourceUrl: saw.sourceUrl, license: saw.license, processedFrom: saw.processedFrom },
    })
  );

  if (checks.some((check) => !check.pass) || !result.ok) {
    process.exitCode = 1;
    return;
  }

  console.log('\nAll hero asset pipeline checks passed.');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
