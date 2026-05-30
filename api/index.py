import sys
import os

# Add backend/src to Python path
current_dir = os.path.dirname(__file__)
backend_src_path = os.path.join(current_dir, "../backend/src")
sys.path.append(backend_src_path)

try:
    from main import app

    # Vercel automatically detects 'app' variable if it's an ASGI/WSGI application
except Exception as e:
    # Fallback handler to show error details in browser
    from http.server import BaseHTTPRequestHandler
    import traceback

    # Debug info
    debug_info = f"CWD: {os.getcwd()}\nSys Path: {sys.path}\n"
    try:
        root_files = os.listdir(os.path.join(current_dir, ".."))
        debug_info += f"Root files: {root_files}\n"
        if "backend" in root_files:
            backend_files = os.listdir(os.path.join(current_dir, "../backend"))
            debug_info += f"Backend files: {backend_files}\n"
            if "src" in backend_files:
                src_files = os.listdir(os.path.join(current_dir, "../backend/src"))
                debug_info += f"Src files: {src_files}\n"
    except Exception as list_err:
        debug_info += f"List dir error: {list_err}\n"

    error_msg = f"Failed to start app.\nError: {str(e)}\nTraceback:\n{traceback.format_exc()}\n\nDebug Info:\n{debug_info}"

    class handler(BaseHTTPRequestHandler):
        def do_GET(self):
            self.send_response(500)
            self.send_header("Content-type", "text/plain")
            self.end_headers()
            self.wfile.write(error_msg.encode("utf-8"))

        def do_POST(self):
            self.do_GET()

        def do_OPTIONS(self):
            self.do_GET()
