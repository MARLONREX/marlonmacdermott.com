from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, quote, urlparse
import json
import re

ROOT = Path(__file__).resolve().parent
CONTENT_ROOT = ROOT / "WorkPages"
PROJECTS = [
    "Co-Living, Byker", "Conygar Quarry", "DeRe Sunniside", "eVTOLs and the City Above",
    "Graffiti and the Surface", "Hazelwood", "High Level Bridge", "House Retrofit",
    "Motorway-Scale Cycle Routes", "New Towns", "Paving for Different Strides",
    "Point Block Modular Retrofit", "Roof Construction", "Site-Specific Trees with AI",
    "The Psychology of Freehand Drawing", "The Supermarket High Street", "Towers in the Park",
    "Workshop",
]
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif", ".svg"}


def ensure_project_folders():
    CONTENT_ROOT.mkdir(exist_ok=True)
    for project in PROJECTS:
        project_path = CONTENT_ROOT / project
        for folder in ("Image1", "Image2", "Image3", "Body of text"):
            (project_path / folder).mkdir(parents=True, exist_ok=True)


def safe_project_path(name):
    if not name or any(character in name for character in ("/", "\\", "..")):
        return None
    candidate = (CONTENT_ROOT / name).resolve()
    try:
        candidate.relative_to(CONTENT_ROOT.resolve())
    except ValueError:
        return None
    return candidate if candidate.is_dir() else None


def folder_number(path):
    match = re.search(r"(\d+)$", path.parent.name)
    return int(match.group(1)) if match else 9999


def read_project(name):
    project_path = safe_project_path(name)
    if not project_path:
        return None

    text_folder = project_path / "Body of text"
    text_parts = []
    if text_folder.is_dir():
        for text_file in sorted(text_folder.iterdir(), key=lambda item: item.name.casefold()):
            if text_file.is_file() and text_file.suffix.casefold() in {".txt", ".md"} and not text_file.name.startswith((".", "_")):
                text_parts.append(text_file.read_text(encoding="utf-8-sig", errors="replace").strip())

    images = []
    image_files = []
    for image_folder in project_path.iterdir():
        if image_folder.is_dir() and re.fullmatch(r"Image\d+", image_folder.name, re.IGNORECASE):
            image_files.extend(
                file for file in image_folder.iterdir()
                if file.is_file() and file.suffix.casefold() in IMAGE_EXTENSIONS and not file.name.startswith(".")
            )

    for image_file in sorted(image_files, key=lambda item: (folder_number(item), item.name.casefold())):
        relative = image_file.relative_to(ROOT).as_posix()
        images.append({"url": "/" + quote(relative, safe="/"), "name": image_file.stem})

    return {"name": name, "text": "\n\n".join(part for part in text_parts if part), "images": images}


class PortfolioHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/project":
            name = parse_qs(parsed.query).get("name", [""])[0]
            project = read_project(name)
            if project is None:
                self.send_error(404, "Unknown project")
                return
            payload = json.dumps(project, ensure_ascii=False).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
            return
        super().do_GET()


if __name__ == "__main__":
    ensure_project_folders()
    print("Private portfolio preview: http://127.0.0.1:8765/index.html")
    ThreadingHTTPServer(("127.0.0.1", 8765), PortfolioHandler).serve_forever()
