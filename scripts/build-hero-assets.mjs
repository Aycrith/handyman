import { generateHeroPack } from './hero-asset-pipeline.mjs';

const result = await generateHeroPack({ write: true });

console.log(`Built hero pack: ${result.manifest.assetSetVersion} ${result.manifest.variant} (${result.manifest.buildStage})`);
for (const [toolId, tool] of Object.entries(result.manifest.tools)) {
  console.log(`- ${toolId}: ${tool.file} ${tool.sha256.slice(0, 12)}... ${tool.provenance}`);
}
