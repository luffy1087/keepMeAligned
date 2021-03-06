var childProcess = require('child_process');
var asker = require('readline-sync');
var fs = require('fs');
var CONFIGURATION = getConfiguration();

process.chdir(CONFIGURATION.repoPath);

executeCommand('git reset --hard & git clean -df & git checkout .');
executeCommand('git checkout ' + CONFIGURATION.mainBranch);
executeCommand('git pull');

var branches = GetBranchesByAuthor();

console.log('These branches will be aligned to ' + CONFIGURATION.mainBranch + '\n');
console.log(branches);
if (asker.question('\nWould you like to do that? (y/n)\n') !== 'y') {
    return;
}

for (var i = 0, retryAttempt = 1, branch; branch = branches[i]; i++) {
    
    if (retryAttempt > 3) {
        console.log('Branch ' + branch + ' cannot be aligned');
        retryAttempt = 1;
        continue;
    }

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
            console.log('CANNOT COMMIT ANYTHING');
        }

        executeCommand('git push');
        
    } catch(e) {
        console.log('RETRY');
        i--;
        retryAttempt++;
    }
}

executeCommand('git checkout ' + CONFIGURATION.mainBranch);

function GetBranchesByAuthor() {
    var ALL_UNMERGED_BRANCHES = childProcess.execSync('git branch -r --no-merged ' + CONFIGURATION.mainBranch).toString().split('\n');
    var branch, author, branchesByAuthor = [];
    for (var i = 0; i < ALL_UNMERGED_BRANCHES.length; i++) {
        branch = ALL_UNMERGED_BRANCHES[i].trim();
        author = childProcess.execSync('git log --pretty=tformat:%an -1 ' + branch).toString().trim();
        if (branch !== '' && author.toLowerCase() === CONFIGURATION.author.toLowerCase()) {
            branchesByAuthor.push(branch.split('/').splice(1).join('/'));
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