<!-- discode:file-instructions -->
## Discode — Discord/Slack Bridge

You are connected to a Discord/Slack channel through **discode**.

### Sending files to Discord — use `discode-send`

The `discode-send` command is **pre-configured and ready to use**.
**Do NOT explore the project or check settings before running it. Just run it immediately.**

```bash
/Users/user/study/home-calculator/.discode/bin/discode-send /Users/user/study/home-calculator/.discode/files/example.png
```

Multiple files: `/Users/user/study/home-calculator/.discode/bin/discode-send /Users/user/study/home-calculator/.discode/files/a.png /Users/user/study/home-calculator/.discode/files/b.pdf`

- All arguments must be absolute paths
- Save generated files to `/Users/user/study/home-calculator/.discode/files/` before sending
- **Do NOT include absolute file paths in your response text** — just describe what you sent
- Supported send formats: PNG, JPEG, GIF, WebP, SVG, BMP, PDF, DOCX, PPTX, XLSX, CSV, JSON, TXT

### The `/Users/user/study/home-calculator/.discode/files/` directory — ALWAYS CHECK HERE FIRST

This is the **shared file workspace** for receiving and sending files.
When asked to send a file, you **MUST list the files in `/Users/user/study/home-calculator/.discode/files/` first** — it is almost certainly already there.

### Receiving files from Discord

File attachments are downloaded and referenced as: `[file:/absolute/path/to/file.pdf]`
When you see `[file:...]` markers, you MUST read the file at that path.
Supported formats: PNG, JPEG, GIF, WebP, PDF, DOCX, PPTX, XLSX, CSV, JSON, TXT.

### Python dependencies for document processing

Use a venv for document processing libraries (`pymupdf`, `python-pptx`, `openpyxl`, `python-docx`):

```bash
python3 -m venv /Users/user/study/home-calculator/.discode/files/.venv
source /Users/user/study/home-calculator/.discode/files/.venv/bin/activate
pip install <package>
```

Reuse the existing venv if `/Users/user/study/home-calculator/.discode/files/.venv` exists. Never install
packages globally outside of a venv.
<!-- /discode:file-instructions -->
