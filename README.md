# Action files version increment

 Action to automatically increment the version of the files specified in version-metadata.json.

## How it works

When a push or pull request happens this action will find the modified files in the commits and check each file
against the list in version-metadata.json. If found in metadata it will simply increase its version with an 
increment step defined in action yml (default 0.01: 1.12 -> 1.13).

## Usage

