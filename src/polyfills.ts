/**
 * Dieses Polyfill ist notwendig, da das Packet "music-metadata-browser" erwartet, dass
 * die Klasse "Buffer" und "process" global existiert. Wahrscheinlich ein überbleibsel
 * von der Protierung von Node.js. Mit diesem Polyfill, werden diese Typen an das
 * Window angehängt, damit "music-metadata-browser" diese finden kann.
 */

import * as process from 'process';
(window as any).process = process;

import * as _buffer from 'buffer';
(window as any).Buffer = _buffer.Buffer; // note: the trailing slash is important!