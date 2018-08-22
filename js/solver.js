function inversePerm(perm) {
    let ret = [];
    let l = perm.length;
    for (let i = 0; i < l; i++) {
        if (perm[i] !== undefined) {
            ret[perm[i]] = i;
        }
    }
    return ret;
}

function afterPerm(x, perm) {
    let ret = [];
    for (let i = 0; i < x.length; i++) {
        if (perm[i] !== undefined) ret[i] = x[perm[i]];
        else ret[i] = x[i];
    }
    return ret;
}

function solve(curSet, aimSet, moveSet, num) {
    if (num === undefined) num = 1;
    for (let i of aimSet) {
        for (let j of curSet) {
            if (j == i) return [[]];
        }
    }
    let inverseSet = {};
    for (let move in moveSet) {
        inverseSet[move] = inversePerm(moveSet[move]);
    }
    ret = [];
    let stateMap1 = {};
    let stateMap2 = {};
    let q1 = [];
    for (let cur of curSet) {
        q1.push({state: cur, step: []});
        stateMap1[cur] = [];
    }
    let q2 = [];
    for (let aim of aimSet) {
        q2.push({state: aim, step: []});
        stateMap2[aim] = [];
    }
    let stepHalf = 5;
    let stepT = 5;
    while (q1.length !== 0 || q2.length !== 0) {
        if (q1.length !== 0) {
            let x = q1[0];
            if (x.step.length < stepHalf) {
                for (let move in moveSet) {
                    let y = {state: afterPerm(x.state, moveSet[move]), step: x.step.concat(move)};
                    if (stateMap1[y.state] !== undefined) continue;
                    q1.push(y);
                    stateMap1[y.state] = y.step;
                    let check = stateMap2[y.state];
                    if (check !== undefined) {
                        num--;
                        ret.push(y.step.concat(check));
                        if (num === 0) {
                            return ret;
                        }
                    }
                }
            }
            q1 = q1.slice(1,);
        }
        if (q2.length !== 0) {
            x = q2[0];
            if (x.step.length < stepT) {
                for (let move in inverseSet) {
                    let y = {state: afterPerm(x.state, inverseSet[move]), step: [move].concat(x.step)};
                    if (stateMap2[y.state] !== undefined) continue;
                    q2.push(y);
                    stateMap2[y.state] = y.step;
                    let check = stateMap1[y.state];
                    if (check !== undefined) {
                        num--;
                        ret.push(check.concat(y.step));
                        if (num === 0) {
                            return ret;
                        }
                    }
                }
            }
            q2 = q2.slice(1,);
        }
    }
    return ret;
}

function clickSol() {
    let text = mySol[this.label].body.firstElementChild.firstElementChild.value;
    let sol = mySol[this.label][0];

    if (text === '') sol.scram = [];
    else sol.scram = text.split(' ');

    if (sol.button === undefined) {
        mySol[this.label].body.insertAdjacentHTML('beforeEnd',
            '<HR>' +
            '<button class = \'btn-primary btn-lg btn-block\' ' +
            'type = \'button\'>' +
            '求解' +
            '</button>'
        );
        sol.button = mySol[this.label].body.lastElementChild;
        sol.button.stage = 0;
        sol.button.label = this.label;
        sol.button.onclick = clickSolve;
    }
}

function clickSolve() {
    let sol = mySol[this.label][this.stage];
    sol.initial = [];
    for (let copy of sol.initialCopy) {
        for (let i = 0; i <= this.stage; i++) {
            for (let move of mySol[this.label][i].scram) {
                copy = afterPerm(copy, mySol[this.label][Math.max(i - 1, 0)].moveSet[move]);
            }
        }
        sol.initial.push(copy);
    }
    sol.got = solve(sol.initial, sol.aimSet, sol.moveSet, 10);
    if (sol.list === undefined) {
        let newListGroup = document.createElement('select');
        newListGroup.multiple = 'multiple';
        newListGroup.className = "form-control";
        mySol[this.label].body.appendChild(newListGroup);
        sol.list = newListGroup;
    }
    sol.list.innerHTML = '';
    for (let i = 0; i < sol.got.length; i++) {
        let newItem = document.createElement('option');
        sol.list.appendChild(newItem);
        newItem.textContent = sol.got[i].join(' ');
        newItem.lab = this.label;
        newItem.stage = this.stage;
        //newItem.index = i;
        newItem.onclick = chooseSol;
    }

}

function chooseSol() {
    if (mySol[this.lab].length <= this.stage + 1) return;
    let sol = mySol[this.lab][this.stage + 1];
    if (sol.button === undefined) {
        mySol[this.lab].body.insertAdjacentHTML('beforeEnd',
            '<HR>' +
            '<button class = \'btn-primary btn-lg btn-block\' ' +
            'type = \'button\'>' +
            '求解' +
            '</button>'
        );
        sol.button = mySol[this.lab].body.lastElementChild;
        sol.button.stage = this.stage + 1;
        sol.button.label = this.lab;
        sol.button.onclick = clickSolve;
        if (this.textContent === '') sol.scram = [];
        else sol.scram = this.textContent.split(' ');
    }
}

function addSolver(type) {


    let sol;
    if (type === '222') {
        sol = New222Solution();
    }
    if (type === '222face') {
        sol = New222FaceFirst();
    }


    document.getElementById('container2').insertAdjacentHTML("beforeEnd",
        "<div class = 'panel panel-success'>" +
        "<div class = 'panel-heading'>" +
        "</div>" +
        "<div class = 'panel-body'>" +
        "<div class = 'input-group'>" +
        "<input class = 'form-control' placeholder = '输入打乱' type = 'text'>" +
        "<span class = 'input-group-btn' >" +
        "<button class = 'btn btn-default' type = 'button'> 确认" +
        "</button>" +
        "</span>" +
        "</div>" +
        "</div>" +
        "</div>");


    let newButton = document.getElementById('container2').lastElementChild.lastElementChild.lastElementChild.lastElementChild;
    newButton.label = cntS;
    newButton.onclick = clickSol;
    let newHeading = document.getElementById('container2').lastElementChild.firstElementChild;
    newHeading.textContent = sol.name;
    mySol.push(sol);
    sol.body = document.getElementById('container2').lastElementChild.lastElementChild;

    cntS++;
}

class solver {
    constructor() {
        this.stages = {};
    }
}

function New222Solution() {
    let sol = new solver();
    sol.aimSet = [];
    let samp = NewCube(2);
    let fin = samp.initState;
    sol.initialCopy = [fin];
    sol.initial = [fin];
    sol.aimSet.push(fin);
    sol.moveSet = {};
    for (let i of ['R', 'R2', 'R\'', 'U', 'U\'', 'U2', 'F', 'F\'', 'F2']) {
        sol.moveSet[i] = samp.permutation[i];
    }
    let solution = [sol];
    solution.name = '二阶魔方直接求解';
    return solution;
}

function copy(arr) {
    let ret = [];
    for (let i of arr) {
        ret.push(i);
    }
    return ret;
}

function New222FaceFirst() {
    let samp = NewCube(2);

    let sol3 = new solver();
    let fin = samp.initState;
    sol3.initialCopy = [copy(fin)];
    sol3.initial = [copy(fin)];
    sol3.aimSet = [copy(fin)];

    let sol = new solver();
    sol.aimSet = [];
    sol.initialCopy = [];
    sol.initial = [];
    for (let i = -1; i <= 1; i++)
        for (let j = -1; j <= 1; j++)
            for (let k = -1; k <= 1; k++)
                if (i * i + j * j + k * k === 1) {
                    for (let f in samp.initState) {
                        samp.initState[f] = 0;
                    }
                    samp.fill(i, j, k, 1 / 2, white);
                    sol.aimSet.push(copy(samp.initState));
                    sol.initialCopy.push(copy(samp.initState));
                    sol.initial.push(copy(samp.initState));
                }

    sol.moveSet = {};
    for (let i of ['R', 'R2', 'R\'', 'U', 'U\'', 'U2', 'F', 'F\'', 'F2']) {
        sol.moveSet[i] = samp.permutation[i];
    }

    let sol2 = new solver();
    sol2.aimSet = [];
    sol2.initialCopy = [];
    sol2.initial = [];
    for (let i = 0; i <= 1; i++)
        for (let j = 0; j <= 1; j++)
            for (let k = 0; k <= 1; k++)
                if (i + j + k === 1) {
                    for (let f in samp.initState) {
                        samp.initState[f] = 0;
                    }
                    samp.fill(i, j, k, 1 / 2, white);
                    samp.fill(i, j, k, - 1 / 2, yellow);
                    sol2.aimSet.push(copy(samp.initState));
                    sol2.initialCopy.push(copy(samp.initState));
                    sol2.initial.push(copy(samp.initState));
                }

    sol2.moveSet = sol.moveSet;
    sol3.moveSet = sol.moveSet;

    let solution = [sol, sol2, sol3];
    solution.name = '二阶魔方面先法';
    return solution;
}