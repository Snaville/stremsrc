"use strict";
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SOURCE_URL = exports.TMDB_META_URL = void 0;
// ponytail: env-overridable so domain rotations need no rebuild
exports.TMDB_META_URL = (_a = process.env.TMDB_META_URL) !== null && _a !== void 0 ? _a : "https://94c8cb9f702d-tmdb-addon.baby-beamup.club/meta";
exports.SOURCE_URL = (_b = process.env.SOURCE_URL) !== null && _b !== void 0 ? _b : "https://vsembed.ru/embed";
