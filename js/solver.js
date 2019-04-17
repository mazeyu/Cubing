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
            if (j.toString() === i.toString()) return [[]];
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

function addView(sol) {
    sol.camera = new THREE.PerspectiveCamera(55, 1.25, 0.1, 1000);
    sol.renderer = new THREE.WebGLRenderer();
    sol.renderer.setSize(250, 200);
    sol.camera.position = new THREE.Vector3(0, -2, 2);
    sol.camera.rotation.x = 1;
    sol.scene = new THREE.Scene();

    let cube = sol.cube;
    for (let piece of cube.pieces) {
        sol.scene.add(piece);
    }

    sol.render = function () {
        requestAnimationFrame(sol.render);
        for (let piece of cube.pieces) {
            piece.children[0].geometry.verticesNeedUpdate = true;
            piece.children[1].geometry.verticesNeedUpdate = true;
        }
        sol.cube.dMove();
        sol.renderer.render(sol.scene, sol.camera);
    };
    sol.render();
}

function clickSol() {
    let text = mySol[this.label].body.firstElementChild.firstElementChild.value;
    let sol = mySol[this.label][0];

    if (text === '') sol.scram = [];
    else sol.scram = text.split(' ');
    sol.cube.reset();
    sol.cube.moveList = sol.scram;

    if (sol.button === undefined) {

        addView(sol);
        mySol[this.label].body.appendChild(sol.renderer.domElement);
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
                copy = afterPerm(copy, mySol[this.label].cube.permutation[move]);
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
        newItem.onclick = chooseSol;
    }

}

function chooseSol() {
    let sol;
    if (mySol[this.lab].length === this.stage + 1) {
        sol = mySol[this.lab];
        if (mySol[this.lab].renderer === undefined) {
            addView(sol);
            mySol[this.lab].body.appendChild(sol.renderer.domElement);
        }
    }

    else sol = mySol[this.lab][this.stage + 1];

    sol.cube.reset();

    for (let i = 0; i <= this.stage; i++) {
        for (let move of mySol[this.lab][i].scram) {
            sol.cube.move0(move, 1);
        }
    }
    if (this.textContent !== '') sol.cube.moveList = sol.cube.moveList.concat(this.textContent.split(' '));

    if (mySol[this.lab].length <= this.stage + 1) return;

    if (sol.button === undefined) {

        addView(sol);
        mySol[this.lab].body.appendChild(sol.renderer.domElement);

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

    }
    if (this.textContent === '') sol.scram = [];
    else sol.scram = this.textContent.split(' ');
}

function addSolver(type) {


    let sol;
    if (type === '222') {
        sol = New222Solution();
    }
    if (type === '222face') {
        sol = New222FaceFirst();
    }
    if (type === '333cfop') {
        sol = NewCFOP();
    }
    if (type === 'pyra') {
        sol = NewPyraminxSolution();
    }
    if (type === '555') {
        sol = New555Solution();
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
        this.aimSet = [];
        this.initialCopy = [];
        this.initial = [];
    }

    push(samp, symm) {

        let state = samp.initState;
        let set = [[], ['y'], ['y2'], ['y\''], ['z'], ['z\'']];
        let set1 = [];
        if (symm === 24) {
            for (let x of set) {
                set1.push(x);
                set1.push(['x'].concat(x));
                set1.push(['x2'].concat(x));
                set1.push(['x\''].concat(x));
            }
            set = set1;
        }
        else if (symm === 4) {
            set = [['y'], ['y2'], ['y\''], []];
        }
        else if (symm === 1) set = [[]];
        for (let x of set) {
            let state1 = copy(state);
            for (let i of x)
                state1 = afterPerm(state1, samp.permutation[i]);
            this.aimSet.push(copy(state1));
            this.initialCopy.push(copy(state1));
            this.initial.push(copy(state1));
        }
    }
}

function New222Solution() {
    let sol = new solver();
    let samp = NewCube(2);
    let fin = samp.initState;
    sol.initialCopy = [fin];
    sol.initial = [fin];
    sol.aimSet = [fin];
    sol.moveSet = {};
    for (let i of ['R', 'R2', 'R\'', 'U', 'U\'', 'U2', 'F', 'F\'', 'F2']) {
        sol.moveSet[i] = samp.permutation[i];
    }
    sol.cube = NewCube(2);
    let solution = [sol];
    solution.cube = NewCube(2);
    solution.name = '二阶魔方直接求解';
    return solution;
}

function NewPyraminxSolution() {
    let sol = new solver();
    let samp = NewPyramix();
    let fin = samp.initState;
    sol.initialCopy = [fin];
    sol.initial = [fin];
    sol.aimSet = [fin];
    sol.moveSet = {};
    for (let i of ['R', 'R\'', 'U', 'U\'', 'B', 'B\'', 'L', 'L\'']) {
        sol.moveSet[i] = samp.permutation[i];
    }
    sol.cube = NewPyramix();
    let solution = [sol];
    solution.cube = NewPyramix();
    solution.name = '金字塔魔方直接求解';
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

    let finish = new solver();
    finish.push(samp, 1);
    let first_face = new solver();
    for (let f in samp.initState)
        samp.initState[f] = 0;
    samp.fill(0, 0, 1, - 1 / 2, white);
    first_face.push(samp, 1);
    first_face.moveSet = {};
    for (let i of ['R', 'R2', 'R\'', 'U', 'U\'', 'U2', 'F', 'F\'', 'F2']) {
        first_face.moveSet[i] = samp.permutation[i];
    }
    let two_face = new solver();
    samp.fill(0, 0, 1, 1 / 2, yellow);
    two_face.push(samp, 1);
    two_face.moveSet = first_face.moveSet;
    finish.moveSet = first_face.moveSet;
    first_face.cube = NewCube(2);
    two_face.cube = NewCube(2);
    finish.cube = NewCube(2);
    let solution = [first_face, two_face, finish];
    solution.cube = NewCube(2);
    solution.name = '二阶魔方面先法';
    return solution;
}

function NewCFOP() {
    let samp = NewCube(3);
    let finish = new solver();
    finish.push(samp, 1);
    let statecopy = copy(samp.initState);

    let cross = new solver();
    for (let i = 0; i < samp.pieces.length; i++) {
        let centroid = samp.centers[i];
        if (centroid.z > -1 / 6 || (Math.abs(centroid.y * centroid.x) > 0.00001)) {
            samp.initState[i] = 0;
        }
    }
    cross.push(samp, 1);

    cross.moveSet = {};
    for (let i of ['R', 'R2', 'R\'', 'U', 'U\'', 'U2', 'F', 'F\'', 'F2', 'L', 'L\'', 'L2', 'D', 'D\'', 'D2', 'B', 'B\'', 'B2']) {
        cross.moveSet[i] = samp.permutation[i];
    }

    cross.cube = NewCube(3);

    let f2l1 = new solver();
    for (let i = 0; i < samp.pieces.length; i++) {
        let centroid = samp.centers[i];
        if (centroid.z < 1 / 6 && centroid.x + centroid.y > 1 / 3) {
            samp.initState[i] = statecopy[i];
        }
    }
    f2l1.push(samp, 4);
    f2l1.cube = NewCube(3);
    f2l1.moveSet = cross.moveSet;

    let f2l2 = new solver();
    for (let i = 0; i < samp.pieces.length; i++) {
        let centroid = samp.centers[i];
        if (centroid.z < 1 / 6 && centroid.x + centroid.y < -1 / 3) {
            samp.initState[i] = statecopy[i];
        }
    }
    f2l2.push(samp, 4);
    for (let i = 0; i < samp.pieces.length; i++) {
        let centroid = samp.centers[i];
        if (centroid.z < 1 / 6 && centroid.x + centroid.y < -1 / 3) {
            samp.initState[i] = 0;
        }
        if (centroid.z < 1 / 6 && centroid.x - centroid.y < -1 / 3) {
            samp.initState[i] = statecopy[i];
        }
    }
    f2l2.push(samp, 4);
    f2l2.cube = NewCube(3);
    f2l2.moveSet = cross.moveSet;

    let f2l3 = new solver();
    for (let i = 0; i < samp.pieces.length; i++) {
        let centroid = samp.centers[i];
        if (centroid.z < 1 / 6 && centroid.x + centroid.y < -1 / 3) {
            samp.initState[i] = statecopy[i];
        }
    }
    f2l3.push(samp, 4);
    f2l3.cube = NewCube(3);
    f2l3.moveSet = cross.moveSet;

    let f2l4 = new solver();
    for (let i = 0; i < samp.pieces.length; i++) {
        let centroid = samp.centers[i];
        if (centroid.z < 1 / 6 && -centroid.x + centroid.y < -1 / 3) {
            samp.initState[i] = statecopy[i];
        }
    }
    f2l4.push(samp, 1);
    f2l4.cube = NewCube(3);
    f2l4.moveSet = cross.moveSet;

    let oll = new solver();
    for (let i = 0; i < samp.pieces.length; i++) {
        let centroid = samp.centers[i];
        if (Math.abs(centroid.z - 1 / 2) < 0.001) {
            samp.initState[i] = statecopy[i];
        }
    }
    oll.push(samp, 1);
    oll.cube = NewCube(3);
    oll.moveSet = cross.moveSet;


    let solution = [cross, f2l1, f2l2, f2l3, f2l4, oll];
    solution.cube = NewCube(3);
    solution.name = '三阶魔方CFOP';
    return solution;
}

function New555Solution() {
    let samp = NewCube(5);

    let finish = new solver();
    finish.push(samp, 1);
    let first_face = new solver();

    for (let i = 0; i < samp.pieces.length; i++) {
        let centroid = samp.centers[i];
        if (Math.abs(centroid.z - 1 / 2) > 0.001 || centroid.x > 0.3 || centroid.y > 0.3 || centroid.x < -0.3 || centroid.y < -0.3) {
            samp.initState[i] = 0;
        }
    }

    first_face.push(samp, 6);
    first_face.moveSet = {};
    for (let i of ['R', 'R2', 'R\'', 'U', 'U\'', 'U2', 'F', 'F\'', 'F2','L', 'L2', 'L\'', 'D', 'D\'', 'D2', 'B', 'B\'', 'B2',
        'r', 'r2', 'r\'', 'u', 'u\'', 'u2', 'f', 'f\'', 'f2','l', 'l2', 'l\'', 'd', 'd\'', 'd2', 'b', 'b\'', 'b2']) {
        first_face.moveSet[i] = samp.permutation[i];
    }

    first_face.cube = NewCube(5);

    let solution = [first_face];
    solution.cube = NewCube(5);
    solution.name = '五阶魔方';
    return solution;
}