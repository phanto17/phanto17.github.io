"""Extract a .unitypackage into a Unity project without the editor.

A .unitypackage is a gzipped tar whose entries are <guid>/pathname, <guid>/asset and
<guid>/asset.meta. Writing them to <pathname> and <pathname>.meta keeps every GUID, so
cross-references inside the package (e.g. TMP Settings -> default font) survive.

usage: python -I tools/extract-unitypackage.py <package.unitypackage> <project root>
"""
import io
import os
import sys
import tarfile


def main(package: str, project: str) -> int:
    entries = {}
    with tarfile.open(package, "r:gz") as tar:
        for member in tar.getmembers():
            parts = member.name.strip("./").split("/")
            if len(parts) != 2:
                continue
            guid, kind = parts
            if kind not in ("pathname", "asset", "asset.meta"):
                continue
            data = tar.extractfile(member).read() if member.isfile() else b""
            entries.setdefault(guid, {})[kind] = data

    written = 0
    for guid, files in entries.items():
        if "pathname" not in files:
            continue
        pathname = files["pathname"].decode("utf-8").splitlines()[0].strip()
        if not pathname.startswith("Assets/"):
            continue
        target = os.path.join(project, *pathname.split("/"))
        if "asset" in files:
            os.makedirs(os.path.dirname(target), exist_ok=True)
            with open(target, "wb") as f:
                f.write(files["asset"])
        else:
            os.makedirs(target, exist_ok=True)
        if "asset.meta" in files:
            with open(target + ".meta", "wb") as f:
                f.write(files["asset.meta"])
        written += 1
    print(f"extracted {written} entries from {os.path.basename(package)} into {project}")
    return 0


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(__doc__)
        sys.exit(2)
    sys.exit(main(sys.argv[1], sys.argv[2]))
