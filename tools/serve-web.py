"""Serve a Unity Web build locally the way itch.io does.

    python tools/serve-web.py <build dir> [port]

Sends `Content-Encoding: gzip` (or br) for the pre-compressed *.unityweb files so the
loader does not need its decompression fallback, sets the right MIME types, and is
threaded so the big data file does not block the wasm request.
"""
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class Handler(SimpleHTTPRequestHandler):
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".wasm": "application/wasm",
        ".js": "application/javascript",
        ".data": "application/octet-stream",
        ".unityweb": "application/octet-stream",
    }

    def send_header(self, keyword, value):
        # The base class picks application/octet-stream for *.unityweb; end_headers sets the real one.
        if keyword.lower() == "content-type" and self.path.split("?")[0].endswith(".unityweb"):
            return
        super().send_header(keyword, value)

    def end_headers(self):
        path = self.path.split("?")[0]
        if path.endswith(".unityweb"):
            with open(self.translate_path(path), "rb") as f:
                magic = f.read(3)
            if magic[:2] == b"\x1f\x8b":
                self.send_header("Content-Encoding", "gzip")
            else:
                self.send_header("Content-Encoding", "br")
            # MIME type from the inner file name (send_header above dropped the default one).
            inner = "application/wasm" if ".wasm" in path else "application/javascript" if ".js" in path else "application/octet-stream"
            super().send_header("Content-Type", inner)
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def log_message(self, fmt, *args):  # quieter
        sys.stderr.write("%s %s\n" % (self.address_string(), fmt % args))


if __name__ == "__main__":
    directory = sys.argv[1]
    port = int(sys.argv[2]) if len(sys.argv) > 2 else 8765
    server = ThreadingHTTPServer(("127.0.0.1", port), partial(Handler, directory=directory))
    print(f"serving {directory} on http://127.0.0.1:{port}/", flush=True)
    server.serve_forever()
