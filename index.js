var childProcess = require('child_process');
var asker = require('readline-sync');
var fs = require('fs');
var CONFIGURATION = getConfiguration();

process.chdir(CONFIGURATION.repoPath);

executeCommand('git reset --hard & git clean -df & git checkout .');
executeCommand('git checkout ' + CONFIGURATION.mainBranch);
executeCommand('git pull');

var branches = GetBranchesByAuthor();
for (var i = 0, retryAttempt = 1, branch; branch = branches[i]; i++) {
    if (retryAttempt > 3) { throw new Error("ATTEMPTS EXCEDEED!"); }

    try {
        executeCommand('git reset --hard & git clean -df & git checkout .');
        executeCommand('git checkout ' + branch);
        
        try {
            executeCommand('git pull');
        } catch(e) {
            console.log('PULL ERROR');
        }

        try {
            executeCommand('git merge ' + CONFIGURATION.mainBranch);
        } catch(e) {
            executeCommand('git mergetool');
        }

        executeCommand('git add .');

        try {
            executeCommand('git commit -m "Merge ' + branch + ' into ' + CONFIGURATION.mainBranch + '"');
        } catch(e) {
            console.log('CANNOT COMMIT NOTHING');
        }

        executeCommand('git push');
        
    } catch(e) {
        console.log('RETRY');
        i--;
        retryAttempt++;
    }
}

function GetBranchesByAuthor() {
    var ALL_UNMERGED_BRANCHES = childProcess.execSync('git branch --no-merged ' + CONFIGURATION.mainBranch-r).toString().split('\n');
    var branch, author, branchesByAuthor = [], splittedBranch;
    for (var i = 0; i < ALL_UNMERGED_BRANCHES.length; i++) {
        branch = ALL_UNMERGED_BRANCHES[i].trim();
        author = childProcess.execSync('git log --pretty=tformat:%an -1 ' + branch).toString().trim();
        if (branch !== '' && author.toLocaleLowerCase() === CONFIGURATION.author) {
            splittedBranch = branch.split('/');
            branchesByAuthor.push(splittedBranch[splittedBranch.length-1]);
        }
    }
    
    return branchesByAuthor;
}

function getConfiguration() {
    if (fs.existsSync('./configuration.json')) {
        return require('./configuration.json');
    }

    var json = {
        author: asker.question('Type the author name\n').trim(),
        repoPath: asker.question('\ntype the repository path\n').trim(),
        mainBranch: asker.question('\ntype the main branch\n').trim()
    };
    
    fs.writeFileSync('./configuration.json', JSON.stringify(json));
    
    return json;
}

function executeCommand(command) {
    console.log(command);
    childProcess.execSync(command);
}