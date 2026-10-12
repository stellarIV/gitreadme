export const GITHUB_ACTION_TEMPLATE = `name: Sync Gitreadme Docs

on:
  push:
    branches: [ main, master ]
  workflow_dispatch:

jobs:
  sync-docs:
    runs-on: ubuntu-latest
    permissions:
      contents: write

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Generate Intelligence & Architecture Docs
        uses: gitreadme/sync-action@v1
        with:
          github-token: \${{ secrets.GITHUB_TOKEN }}
          mode: 'professional' # or 'roast'
          output-file: 'docs/ARCHITECTURE.md'
          update-readme: false

      - name: Commit & Push Changes
        run: |
          git config --global user.name "gitreadme-bot[bot]"
          git config --global user.email "bot@gitreadme.dev"
          git add docs/ARCHITECTURE.md README.md || true
          git diff --staged --quiet || git commit -m "docs: auto-sync living architecture via gitreadme"
          git push
`;
