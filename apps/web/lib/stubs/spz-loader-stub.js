/**
 * Stub for @spz-loader/core.
 * Cesium 1.145.0's GltfSpzLoader imports @spz-loader/core, which embeds a raw WASM binary
 * inside an ES template string containing octal escapes (\0 followed by digits).
 * This throws "Uncaught SyntaxError: Octal escape sequences are not allowed in template strings"
 * in browsers, failing Chunk 318 load.
 * BhuSetu 3D does not use SPZ gaussian splats, so this safe stub resolves the chunk load failure cleanly.
 */

export async function loadSpz() {
  throw new Error("@spz-loader/core is not required or used in BhuSetu 3D.");
}

const stub = { loadSpz };
export default stub;
