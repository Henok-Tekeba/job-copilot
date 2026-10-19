/**
 * Engine version. Bump on any engine change — the eval final run happens
 * exactly once per version, and the version is stamped into every result
 * file, test-run log line, and the Method page.
 *
 * 0.1.0 — first rules engine, final run on unaudited labels.
 * 0.2.0 — engine rules unchanged; labels audited (label_audit.json), so the
 *         final test run re-executes once against audited labels.
 */
export const ENGINE_VERSION = "0.2.0";
