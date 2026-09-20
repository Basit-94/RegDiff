#!/usr/bin/env python3
"""
RegDiff GitHub Action & CLI Governance Runner
Continuous Compliance CI/CD Gate for Corporate & Regulatory Law.

Usage:
  python scripts/regdiff-cli.py --file policies/DATA_RETENTION.md --framework cfpb
"""

import sys
import os
import argparse
import json
import urllib.request
import urllib.error

def main():
    parser = argparse.ArgumentParser(description="RegDiff CI/CD Continuous Compliance Gate")
    parser.add_argument("--file", required=True, help="Path to policy or configuration file")
    parser.add_argument("--framework", default="cfpb", choices=["cfpb", "eu_ai", "nydfs"], help="Regulatory framework to enforce")
    parser.add_argument("--endpoint", default="http://localhost:8000/api/v1/policies/cicd_check", help="RegDiff API endpoint")
    parser.add_argument("--repo", default=os.getenv("GITHUB_REPOSITORY", "apex-fintech/core-banking"))
    parser.add_argument("--branch", default=os.getenv("GITHUB_REF_NAME", "feature/data-governance"))
    parser.add_argument("--commit", default=os.getenv("GITHUB_SHA", "HEAD"))
    parser.add_argument("--pr", type=int, default=int(os.getenv("GITHUB_PR_NUMBER", "108")))
    args = parser.parse_args()

    if not os.path.exists(args.file):
        print(f"Error: File not found: {args.file}", file=sys.stderr)
        sys.exit(2)

    with open(args.file, "r", encoding="utf-8") as f:
        content = f.read()

    payload = {
        "repository": args.repo,
        "branch": args.branch,
        "commit_sha": args.commit[:7],
        "pr_number": args.pr,
        "file_path": args.file,
        "policy_text": content,
        "framework_id": args.framework
    }

    req = urllib.request.Request(
        args.endpoint,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )

    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            print(data["github_markdown_comment"])
            if data["status"] == "BLOCKED":
                print("\n[RegDiff CI/CD Gate] BLOCKED: Regulatory breach detected. Merge rejected.", file=sys.stderr)
                sys.exit(1)
            else:
                print("\n[RegDiff CI/CD Gate] PASSED: All provisions satisfy statutory limits.")
                sys.exit(0)
    except urllib.error.URLError as e:
        print(f"Connection error to RegDiff Sentinel at {args.endpoint}: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
