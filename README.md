# XML-RPC GUI Tool

A desktop GUI to interact with XML-RPC endpoints (e.g., WordPress `/xmlrpc.php`) with full control, request history, inline method tips, and strong error handling.

Features:
- Endpoint control: base URL, path, and request timeout
- Auth fields: username/password for WordPress methods
- Presets with tips: `system.listMethods`, `system.methodHelp`, `wp.getUsersBlogs`, `metaWeblog.getRecentPosts`
- Generic runner: call any method with JSON params
- Output panes: formatted response and a raw XML area (best-effort)
- Status details: duration, response size, friendly errors with stack info
- History: save requests, load last, view and reuse from a list

## Requirements
- Python 3.9+

## Setup
```powershell
# Optional: create a virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# No external dependencies required (uses stdlib)
```

## Run
```powershell
python app\main.py
```

## Tips
- WordPress typically uses the `metaWeblog` and `wp` namespaces. Some methods require username/password.
- For custom parameters in the generic runner, provide a JSON array (e.g., `["param1", 123, {"key":"value"}]`).
- Hover preset buttons to see short documentation.
- Timeout helps when endpoints are slow; default is 30s.
- Errors show a detailed message and stack trace dialog.

## Common Methods
- `system.listMethods`: List all available methods.
- `system.methodHelp`: Show doc for the method typed in the Method field.
- `wp.getUsersBlogs`: Requires username/password.
- `metaWeblog.getRecentPosts`: Requires username/password; default blog id is 0.
