const core = require('@actions/core');
const github = require('@actions/github');

(async() => {
    const octokit = github.getOctokit(core.getInput('token'));
    
    let destRepo = core.getInput("dest-repo");
    if (destRepo.length == 0) 
        destRepo = github.context.payload.repository.full_name;
    const sourceRepo = core.getInput("source-repo");
    const regexFilter = core.getInput("regex-filter");
    const nameFormat = core.getInput("name-format");

    const [ sourceOwner, sourceRepoName ] = sourceRepo.split('/');
    const [ destOwner, destRepoName ] = destRepo.split('/');
    
    const copyLabels = await octokit.rest.issues.listLabelsForRepo({
        owner: sourceOwner, repo: sourceRepoName
    });
    const currentLabels = await octokit.rest.issues.listLabelsForRepo({
        owner: destOwner, repo: destRepoName
    });
    
    for (const label of copyLabels.data) {
        if (label.name.match(regexFilter) === null) continue;

        const newName = nameFormat.replace("${name}", label.name);
        const curLabelIdx = currentLabels.data.findIndex(lbl => lbl.name == label.name);
        if (curLabelIdx >= 0) {
            const existing = currentLabels.data[curLabelIdx];
            core.warning(`Overwriting label ${existing.name}...`)
            await octokit.rest.issues.deleteLabel({
                owner: destOwner, repo: destRepoName, name: existing.name
            });
        } 

        await octokit.rest.issues.createLabel({
            owner: destOwner, repo: destRepoName, 
            name: newName,
            color: label.color,
            description: label.description
        });
        core.info(`Created label ${newName} @ ${destRepo}`)
    }
})();