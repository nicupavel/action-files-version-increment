# Action files version increment

 Action to automatically increment the version of the files specified in version-metadata.json.

## How it works

When a push or pull request happens this action will find the modified files in the commits and check each file
against the list in version-metadata.json. If found in metadata it will simply increase its version with an 
increment step defined in action yml (default 0.01: 1.12 -> 1.13).

## Usage
 
Add in .github/workflows/main.yml the following flow:

```
on: [push]

jobs:
  versioning_job:
    runs-on: ubuntu-latest
    name: RainMachine Parsers versioning
    steps:
      - name: Checkout
        uses: actions/checkout@v2
        with:
          fetch-depth: 0
      - name: Checking for files to increase version
        uses: ./
        id: versioning_job
        with:
          metadata-file: 'version-metadata.json'
          version-increment: 0.01
      - name: Get the output time
        run: echo "The time was ${{ steps.versioning_job.outputs.time }}"
      - name: Get list of modified files
        run: echo "Modified files ${{ steps.versioning_job.outputs.modified_files }}"
      - name: Commit metadata file
        run: |
          git config --local user.email "$GITHUB_ACTOR@users.noreply.github.com"
          git config --local user.name "$GITHUB_ACTOR"
          git commit -am "Versioning for ${{ steps.versioning_job.outputs.modified_files }}"
      - name: Push changes
        uses: ad-m/github-push-action@master
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          branch: ${{ github.head_ref }}
```

## Files Metadata

The files that need version update are specified in a json file (version-metadata.json). The minimal required format is:

```
{
  "files": {
    "path/file1": {
      "version": "1.01"
    },
    "path2/file2": {
      "version": "1.01"
    }
  }
}
```