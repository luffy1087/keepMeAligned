var childProcess = require('child_process');
var asker = require('readline-sync');
var fs = require('fs');
var CONFIGURATION = getConfiguration();

process.chdir(CONFIGURATION.repoPath);

childProcess.execSync('git reset --hard & git clean -df & git checkout .');
childProcess.execSync('git checkout ' + CONFIGURATION.mainBranch);
childProcess.execSync('git pull');

var branches = GetBranchesByAuthor();
for (var i = 0, retryAttempt = 1, b; b = branches[i]; i++) {
    if (retryAttempt > 3) { throw new Error("ATTEMPTS EXCEDEED!"); }

    try {
        console.log('git reset --hard & git clean -df & git checkout .');
        //childProcess.execSync('git reset --hard & git clean -df & git checkout .');
        console.log('git checkout ' + b);
        //childProcess.execSync('git checkout ' + b);
        try {
            console.log('git pull');
            //childProcess.execSync('git pull');
        } catch(e) {
            console.log('PULL ERROR');
        }
        try {
            console.log('git merge development');
            //childProcess.execSync('git merge development');
        } catch(e) {
            console.log('MERGE TOOL');
            //childProcess.execSync('git mergetool');
        }
        //childProcess.execSync('git status');
        //childProcess.execSync('git add .');
        try {
            console.log('git commit -m "Merge ' + b + ' into development"');
            //childProcess.execSync('git commit -m "Merge ' + b + ' into development"');
        }catch(e) {
            console.log('CANNOT COMMIT NOTHING');
        }
        console.log('git push');
        //childProcess.execSync('git push');
    } catch(e) {
        console.log('RETRY');
        i--;
        retryAttempt++;
    }
}

function GetBranchesByAuthor() {
    var ALL_UNMERGED_BRANCHES = childProcess.execSync('git branch --no-merged development -r').toString().split('\n');
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