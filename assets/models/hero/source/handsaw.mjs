const toothParts = Array.from({ length: 11 }, (_, index) => {
  const x = -1.34 + index * 0.10;
  return {
    name: `steel_tooth_${index + 1}`,
    role: 'steel',
    kind: 'extrudedPolygon',
    points: [
      [-0.05, 0.00],
      [0.05, 0.00],
      [0.00, -0.08],
    ],
    depth: 0.04,
    translation: [x, -0.16, 0.0],
  };
});

const rivetParts = [
  { x: 0.02, y: 0.04 },
  { x: 0.18, y: -0.04 },
  { x: 0.34, y: 0.00 },
].map((position, index) => ({
  name: `brass_rivet_${index + 1}`,
  role: 'brass',
  kind: 'cylinder',
  radiusTop: 0.04,
  radiusBottom: 0.04,
  height: 0.08,
  segments: 12,
  translation: [position.x, position.y, 0.0],
  rotationEuler: [1.5707963268, 0.0, 0.0],
}));

const spineSlots = Array.from({ length: 4 }, (_, index) => ({
  name: `blackened_steel_spine_slot_${index + 1}`,
  role: 'blackened_steel',
  kind: 'box',
  size: [0.10, 0.04, 0.05],
  translation: [-1.14 + index * 0.30, 0.15, 0.0],
}));

const handsawDescriptor = {
  id: 'saw',
  file: 'hero-handsaw.glb',
  dimensions: {
    width: 2.24,
    height: 0.96,
    depth: 0.14,
  },
  silhouetteProfile: 'precision-handsaw-workshop-support',
  pivotOrigin: {
    mode: 'authored-origin',
    description: 'Grip center for balanced support framing.',
    coordinates: [0, 0, 0],
  },
  materialTokens: ['steel', 'blackened_steel', 'rubber', 'brass'],
  calibration: {
    targetSize: 2.04,
    originMode: 'authored-origin',
    compositionRole: 'support-silhouette',
    supportLightPrivilege: 0.64,
  },
  parts: [
    {
      name: 'steel_blade',
      role: 'steel',
      kind: 'extrudedPolygon',
      points: [
        [-1.56, 0.18],
        [-0.34, 0.14],
        [-0.06, 0.02],
        [-0.22, -0.10],
        [-1.44, -0.18],
        [-1.60, -0.10],
      ],
      depth: 0.04,
      translation: [0.0, 0.0, 0.0],
    },
    {
      name: 'blackened_steel_spine',
      role: 'blackened_steel',
      kind: 'box',
      size: [1.18, 0.04, 0.06],
      translation: [-0.98, 0.17, 0.0],
    },
    ...spineSlots,
    ...toothParts,
    {
      name: 'rubber_handle_back',
      role: 'rubber',
      kind: 'box',
      size: [0.12, 0.46, 0.12],
      translation: [0.06, 0.02, 0.0],
    },
    {
      name: 'rubber_handle_front',
      role: 'rubber',
      kind: 'box',
      size: [0.12, 0.62, 0.12],
      translation: [0.56, 0.02, 0.0],
    },
    {
      name: 'rubber_handle_top',
      role: 'rubber',
      kind: 'box',
      size: [0.54, 0.12, 0.12],
      translation: [0.32, 0.26, 0.0],
    },
    {
      name: 'rubber_handle_bottom',
      role: 'rubber',
      kind: 'box',
      size: [0.36, 0.12, 0.12],
      translation: [0.24, -0.20, 0.0],
    },
    {
      name: 'rubber_handle_brace',
      role: 'rubber',
      kind: 'taperedBox',
      widthBottom: 0.20,
      widthTop: 0.12,
      depthBottom: 0.12,
      depthTop: 0.12,
      height: 0.26,
      translation: [0.22, -0.02, 0.0],
      rotationEuler: [0.0, 0.0, -0.30],
    },
    {
      name: 'rubber_handle_inset',
      role: 'rubber',
      kind: 'box',
      size: [0.26, 0.16, 0.08],
      translation: [0.28, 0.02, 0.05],
    },
    {
      name: 'brass_medallion',
      role: 'brass',
      kind: 'cylinder',
      radiusTop: 0.06,
      radiusBottom: 0.06,
      height: 0.04,
      segments: 12,
      translation: [0.48, 0.00, 0.05],
      rotationEuler: [1.5707963268, 0.0, 0.0],
    },
    ...rivetParts,
  ],
};

export default handsawDescriptor;
