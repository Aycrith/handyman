import hammer from './hammer.mjs';
import wrench from './wrench.mjs';
import handsaw from './handsaw.mjs';

export const HERO_ASSET_DESCRIPTORS = Object.freeze({
  hammer,
  wrench,
  saw: handsaw,
});

export const HERO_BUILD_ORDER = Object.freeze(['hammer', 'wrench', 'saw']);
