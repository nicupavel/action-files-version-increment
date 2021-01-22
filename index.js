const core = require('@actions/core');
const github = require('@actions/github');
const childProcess = require("child_process");
const { promises: fs } = require("fs");

const execute = (command) => new Promise((resolve, reject) => {
    childProcess.exec(command, (error, stdout, stderr) => {
        if (error || stderr) {
            reject(stderr);
            return;
        }
        resolve(stdout);
    });
})

const loadMetaFile = async(filename) => {
    try {
        let content = await fs.readFile(filename);
        return JSON.parse(content);
    } catch (e) {
        return {};
    };
}

const saveMetaFile = async(filename, json) => {
    try {
        await fs.writeFile(filename, JSON.stringify(json, null, 2));
        return true;
    } catch (e) {
        return false;
    }
}
const main = async() => {
    const metadataFile = core.getInput('metadata-file');
    const versionIncrement = parseFloat(core.getInput('version-increment'));
    core.info(`Using ${metadataFile} with version increment ${versionIncrement}`);

    if (isNaN(versionIncrement) || !isFinite(versionIncrement)) {
        core.setFailed(
            `Invalid versioning increment requires a correct floating point or integer numeral.`
        );
    }

    const time = (new Date()).toTimeString();
    core.setOutput("time", time);

    const context = github.context;
    const eventName = context.eventName
    const payload = context.payload;

    let base;
    let head;

    switch (eventName) {
        case 'pull_request':
            base = payload.pull_request.base.sha;
            head = payload.pull_request.head.sha;
            break;
        case 'push':
            base = payload.before;
            head = payload.after;
            break;
        default:
            core.setFailed(
                `This action only supports pull requests and pushes, ${eventName} events are not supported. ` +
                "Please submit an issue on this action's GitHub repo if you believe this in correct."
            );
    }

    core.info(`Base commit: ${base}`);
    core.info(`Head commit: ${head}`);

    if (!base || !head) {
        core.setFailed(
            `The base and head commits are missing from the payload for this ${eventName} event. ` +
            "Please submit an issue on this action's GitHub repo."
        )
    }

    let files_list;
    let matched_files_list = [];

    try {
        //let files = await execute(`git diff-tree --no-commit-id --name-only -r ${head}`);
        let files = await execute(`git diff --name-only ${head} ${base}`);
        files_list = files.split('\n');
    } catch (e) {
        core.setFailed(`Error executing git diff ${e}`);
    }

    let metadata = await loadMetaFile(metadataFile);

    for (const name of files_list) {
        if (name in metadata.files) {
            let ver = +metadata.files[name].version;
            if (ver === undefined) {
                ver = 1.0;
            }
            core.info(`${name}: ${ver} -> ${ver + versionIncrement}`);
            ver = ver + versionIncrement;
            metadata.files[name].version = ver.toFixed(2);
            matched_files_list.push(name);
        }
    }

    core.setOutput("modified_files", matched_files_list.join(','));

    if (!saveMetaFile(metadataFile, metadata)) {
        core.setFailed('Cannot save new metadata');
    }
}


main().catch(err => {
    console.error(err);
    process.exit(err.code || -1);
})