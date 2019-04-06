function vecMulScal(vec, scal) {
    return new THREE.Vector3(vec.x * scal, vec.y * scal, vec.z * scal);
}

function vecAddVec(a, b) {
    return new THREE.Vector3(a.x + b.x, a.y + b.y, a.z + b.z);
}

function vecSubVec(a, b) {
    return new THREE.Vector3(a.x - b.x, a.y - b.y, a.z - b.z);
}

function norm(a) {
    return vecMulScal(a, 1 / a.length());
}

function cross(a, b) {
    let ret = new THREE.Vector3();
    ret.cross(a, b);
    return ret;
}

class Tcube {
    reset() {
        let v = this.restorev;
        let f = this.restoref;
        for (let i = 0; i < f.length; i++) {
            let face = f[i];
            let abcd = [];
            let geo = this.pieces[i].children[0].geometry;
            if (face instanceof THREE.Face4) {
                abcd = [face.a, face.b, face.c, face.d];
            }
            else if (face instanceof THREE.Face3) {
                abcd = [face.a, face.b, face.c];
            }
            for (let j = 0; j < abcd.length; j++) {
                let a = abcd[j];
                geo.vertices[j] = new THREE.Vector3(v[a].x, v[a].y, v[a].z);
            }
            geo.computeCentroids();
            let centroid = geo.faces[0].centroid;
            for (let v of geo.vertices) {
                v.sub(v, centroid);
                v.multiplyScalar(0.9);
                v.add(v, centroid);
            }
        }
    }

    constructor(v, f) {
        this.restorev = v;
        this.restoref = f;
        this.initState = [];
        this.pieces = [];
        this.moveData = {};
        this.permutation = {};
        this.moveList = [];
        this.currentMove = {move: '', prog: 0};
        this.centers = [];
        for (let face of f) {
            let geo = new THREE.Geometry();
            let mat = [new THREE.MeshBasicMaterial({color: 0}),
                new THREE.MeshBasicMaterial({color: 0, wireframe: true})];
            geo.vertices = [];
            let abcd = [];
            if (face instanceof THREE.Face4) {
                abcd = [face.a, face.b, face.c, face.d];
                geo.faces = [new THREE.Face4(0, 1, 2, 3)];
            }
            else if (face instanceof THREE.Face3) {
                abcd = [face.a, face.b, face.c];
                geo.faces = [new THREE.Face3(0, 1, 2)];
            }
            for (let a of abcd) {
                geo.vertices.push(new THREE.Vector3(v[a].x, v[a].y, v[a].z));
            }
            geo.computeCentroids();
            let centroid = geo.faces[0].centroid;

            for (let v of geo.vertices) {
                v.sub(v, centroid);
                v.multiplyScalar(0.9);
                v.add(v, centroid);
            }
            let mesh = THREE.SceneUtils.createMultiMaterialObject(geo, mat);
            //mesh.children[1].material.wireframeLinewidth = 10;
            this.pieces.push(mesh);
            this.centers.push(centroid);
        }
    }

    fill(x, y, z, v, c) {
        for (let i = 0; i < this.pieces.length; i++) {
            let cal = this.centers[i].dot(new THREE.Vector3(x, y, z));
            if (Math.abs(cal - v) < 0.0001) {
                let mat = new THREE.MeshBasicMaterial({color: c});
                mat.side = THREE.DoubleSide;
                this.pieces[i].children[0].material = mat;
                this.initState[i] = c;
            }
        }
    }

    move0(move, gra) {
        let x = this.moveData[move].x;
        let y = this.moveData[move].y;
        let z = this.moveData[move].z;
        let v = this.moveData[move].v;
        let v2 = this.moveData[move].v2;
        let d = this.moveData[move].d;
        for (let i = 0; i < this.pieces.length; i++) {
            this.pieces[i].children[0].geometry.computeCentroids();
            let centroid = this.pieces[i].children[0].geometry.faces[0].centroid;
            if (centroid.dot(new THREE.Vector3(x, y, z)) >= v && (v2 === undefined || centroid.dot(new THREE.Vector3(x, y, z)) <= v2)) {
                let vs = this.pieces[i].children[0].geometry.vertices;
                for (let v of vs) {
                    let ax = norm(new THREE.Vector3(x, y, z));
                    let base0 = vecAddVec(this.center, vecMulScal(ax, vecSubVec(v, this.center).dot(ax)));
                    let base1 = vecSubVec(v, base0);
                    let base2 = vecMulScal(norm(cross(base1, new THREE.Vector3(x, y, z))), base1.length());
                    let theta = 2 * Math.PI * d / gra;
                    v.copy(vecAddVec(vecAddVec(base0, base1.multiplyScalar(Math.cos(theta))), base2.multiplyScalar(Math.sin(theta))));
                }
            }
        }
    }
    dMove() {
        let gra = 20;
        if (this.gra !== undefined) gra = this.gra;
        if (this.currentMove.prog === 0) {
            if (this.moveList.length === 0) return;
            this.currentMove = {move: this.moveList[0], prog: gra};
            this.moveList = this.moveList.slice(1,);
        }
        let move = this.currentMove.move;
        this.move0(move, gra);
        this.currentMove.prog -= 1;
    }

    addmove(x, y, z, v, move, v2, g) {
        let pieces = [];
        this.center = new THREE.Vector3();
        for (let i = 0; i < this.pieces.length; i++) {
            this.pieces[i].children[0].geometry.computeCentroids();
            let centroid = this.pieces[i].children[0].geometry.faces[0].centroid;
            this.center.addSelf(centroid);
        }
        this.center.divideScalar(this.pieces.length);

        for (let i = 0; i < this.pieces.length; i++) {
            let centroid = this.pieces[i].children[0].geometry.faces[0].centroid;
            if (centroid.dot(new THREE.Vector3(x, y, z)) >= v && (v2 === undefined || centroid.dot(new THREE.Vector3(x, y, z)) <= v2)) {
                centroid.subSelf(this.center);
                let vec = new THREE.Vector3();
                vec.cross(centroid, new THREE.Vector3(x, y, z));
                pieces.push({len: vec.length(), dep: centroid.dot(new THREE.Vector3(x, y, z)), v: vec, id: i});
            }
        }
        pieces.sort((a, b) => a.len - b.len);
        let lenmap = {};
        for (let piece of pieces) {
            let piecelen = [Math.round(piece.len * 1000), Math.round(piece.dep * 1000)];
            if (piecelen in lenmap) {
                lenmap[piecelen].push(piece);
                let cos = piece.v.dot(lenmap[piecelen][0].v);
                let sin = new THREE.Vector3().cross(piece.v, lenmap[piecelen][0].v);
                if (sin.dot(new THREE.Vector3(x, y, z)) > 0) {
                    sin = sin.length();
                }
                else {
                    sin = -sin.length();
                }
                piece.angle = Math.atan2(sin, cos);
            }
            else {
                piece.angle = 0;
                lenmap[piecelen] = [piece];
            }
        }

        function gcd(a, b) {
            if (b === 0) return a;
            return gcd(b, a % b);
        }
        let myg = 0;
        for (let i in lenmap) {
            if (i.split(',')[0] != 0) {
                lenmap[i].sort((a, b) => a.angle - b.angle);
                myg = gcd(myg, lenmap[i].length);
            }
        }
        if (g === undefined) g = myg;
        let tot = this.pieces.length;
        this.permutation[move] = [];
        this.permutation[move + '2'] = [];
        this.permutation[move + '\''] = [];
        this.permutation[move + '\'2'] = [];
        for (let i in lenmap) {
            if (i.split(',')[0] == 0) {
                for (let x of lenmap[i]) {
                    this.permutation[move][x.id] = x.id;
                    this.permutation[move + '2'][x.id] = x.id;
                    this.permutation[move + '\''][x.id] = x.id;
                    this.permutation[move + '\'2'][x.id] = x.id;
                }
                continue;
            }
            let l = lenmap[i].length;
            for (let j = 0; j < l; j++) {
                this.permutation[move][lenmap[i][j].id] = lenmap[i][(j - l / g + l) % l].id;
                this.permutation[move + '2'][lenmap[i][j].id] = lenmap[i][(j - 2 * l / g + l) % l].id;
                this.permutation[move + '\''][lenmap[i][j].id] = lenmap[i][(j + l / g) % l].id;
                this.permutation[move + '\'2'][lenmap[i][j].id] = lenmap[i][(j + 2 * l / g) % l].id;
            }
        }

        this.moveData[move] = {x: x, y: y, z: z, v: v, d: 1 / g, v2: v2};
        this.moveData[move + '2'] = {x: x, y: y, z: z, v: v, d: 2 / g, v2: v2};
        this.moveData[move + '\''] = {x: x, y: y, z: z, v: v, d: -1 / g, v2: v2};
        this.moveData[move + '\'2'] = {x: x, y: y, z: z, v: v, d: -2 / g, v2: v2};
    }

}

let green = 0x00ff00;
let blue = 0x0000ff;
let red = 0xff0000;
let orange = 0xffa500;
let white = 0xeeeeee;
let yellow = 0xffff00;

function NewSkew() {
    let n = 1;
    let v = new THREE.CubeGeometry(1, 1, 1, n, n, n).vertices;
    let fs = new THREE.CubeGeometry(1, 1, 1, n, n, n).faces;
    let finalF = [];
    for (let f of fs) {
        let cnt = v.length;
        let abcd = [f.a, f.b, f.c, f.d];
        for (let i = 0; i < 4; i++) {
            let forward = (i + 1) % 4, backward = (i + 3) % 4;
            v.push(vecMulScal(vecAddVec(v[abcd[i]], v[abcd[forward]]), 0.5));
            finalF.push(new THREE.Face3(abcd[i], cnt + i, cnt + backward));
        }
        finalF.push(new THREE.Face4(cnt, cnt + 1, cnt + 2, cnt + 3));
    }
    let cube = new Tcube(v, finalF);
    cube.fill(1, 0, 0, 1 / 2, red);
    cube.fill(1, 0, 0, -1 / 2, orange);
    cube.fill(0, 0, 1, 1 / 2, white);
    cube.fill(0, 0, 1, -1 / 2, yellow);
    cube.fill(0, 1, 0, 1 / 2, blue);
    cube.fill(0, 1, 0, -1 / 2, green);

    cube.addmove(1, 0, 0, -999, 'x', 999, 4);
    cube.addmove(0, 0, 1, -999, 'y', 999, 4);
    cube.addmove(0, -1, 0, -999, 'z', 999, 4);


    cube.addmove(1, -1, -1, 0, 'R');
    cube.addmove(-1, -1, 1, 0, 'L');

    cube.name = "斜转魔方";
    return cube
}


function NewPyramix() {
    let height = Math.sqrt(6) * 2 / 3;
    let ax1 = vecMulScal(new THREE.Vector3(1, 0, 0), 2 / 3);
    let ax2 = vecMulScal(new THREE.Vector3(1 / 2, Math.sqrt(3) / 2, 0), 2 / 3);
    let ax3 = vecMulScal(new THREE.Vector3(1 / 2, Math.sqrt(3) / 6, height / 2), 2/ 3);
    let v = [];
    let f = [];

    function work(o, base1, base2) {
        for (let i = 0; i < 4; i++)
            for (let j = 0; j < 4; j++) {
                if (i + j <= 2) {
                    let cnt = v.length;
                    v.push(vecAddVec(o, vecAddVec(vecMulScal(base1, i), vecMulScal(base2, j))));
                    v.push(vecAddVec(o, vecAddVec(vecMulScal(base1, i + 1), vecMulScal(base2, j))));
                    v.push(vecAddVec(o, vecAddVec(vecMulScal(base1, i), vecMulScal(base2, j + 1))));
                    f.push(new THREE.Face3(cnt, cnt + 1, cnt + 2));
                }
                if (i >= 1 && j >= 1 && i + j >= 2 && i + j <= 3) {
                    let cnt = v.length;
                    v.push(vecAddVec(o, vecAddVec(vecMulScal(base1, i), vecMulScal(base2, j))));
                    v.push(vecAddVec(o, vecAddVec(vecMulScal(base1, i - 1), vecMulScal(base2, j))));
                    v.push(vecAddVec(o, vecAddVec(vecMulScal(base1, i), vecMulScal(base2, j - 1))));
                    f.push(new THREE.Face3(cnt, cnt + 1, cnt + 2));
                }
            }
    }

    work(new THREE.Vector3(), ax1, ax2);
    work(new THREE.Vector3(), ax2, ax3);
    work(new THREE.Vector3(), ax3, ax1);
    work(vecMulScal(ax1, 3), vecSubVec(ax2, ax1), vecSubVec(ax3, ax1));
    let pyra = new Tcube(v, f);
    let ax13 = norm(cross(ax1, ax3));
    let ax23 = norm(cross(ax2, ax3));
    let ax123 = norm(vecAddVec(ax1, vecAddVec(ax2, ax3)));
    pyra.fill(0, 0, 1, 0, yellow);
    pyra.fill(ax13.x, ax13.y, ax13.z, 0, green);
    pyra.fill(ax23.x, ax23.y, ax23.z, 0, red);
    pyra.fill(ax123.x, ax123.y, ax123.z, height, blue);
    pyra.addmove(-ax123.x, -ax123.y, -ax123.z, -2 * height / 3, 'L');
    pyra.addmove(-ax13.x, -ax13.y, -ax13.z, height / 3, 'B');
    pyra.addmove(ax23.x, ax23.y, ax23.z, height / 3, 'R');
    pyra.addmove(0, 0, 1, height / 3, 'U');

    pyra.addmove(ax23.x, ax23.y, ax23.z, -999, 'x', 999, 3);
    pyra.addmove(0, 0, 1, -999, 'y', 999, 3);
    pyra.name = '金字塔魔方';
    return pyra;
}


function NewCube(n) {

    let v = new THREE.CubeGeometry(1, 1, 1, n, n, n).vertices;
    let f = new THREE.CubeGeometry(1, 1, 1, n, n, n).faces;
    let cube = new Tcube(v, f);

    cube.fill(1, 0, 0, 1 / 2, red);
    cube.fill(1, 0, 0, -1 / 2, orange);
    cube.fill(0, 0, 1, 1 / 2, white);
    cube.fill(0, 0, 1, -1 / 2, yellow);
    cube.fill(0, 1, 0, 1 / 2, blue);
    cube.fill(0, 1, 0, -1 / 2, green);
    let thre = 1 / 2 - 1 / n - 0.01;
    cube.addmove(-1, 0, 0, -thre, 'M', thre, 4);
    cube.addmove(1, 0, 0, thre, 'R');
    cube.addmove(-1, 0, 0, thre, 'L');
    cube.addmove(0, 0, 1, thre, 'U');
    cube.addmove(0, 0, -1, thre, 'D');
    cube.addmove(0, -1, 0, thre, 'F');
    cube.addmove(0, 1, 0, thre, 'B');
    cube.addmove(1, 0, 0, thre - 1 / n, 'r');
    cube.addmove(-1, 0, 0, thre - 1 / n, 'l');
    cube.addmove(0, 0, 1, thre - 1 / n, 'u');
    cube.addmove(0, 0, -1, thre - 1 / n, 'd');
    cube.addmove(0, -1, 0, thre - 1 / n, 'f');
    cube.addmove(0, 1, 0, thre - 1 / n, 'b');

    cube.addmove(1, 0, 0, thre - 2 / n, '3r');
    cube.addmove(-1, 0, 0, thre - 2 / n, '3l');
    cube.addmove(0, 0, 1, thre - 2 / n, '3u');
    cube.addmove(0, 0, -1, thre - 2 / n, '3d');
    cube.addmove(0, -1, 0, thre - 2 / n, '3f');
    cube.addmove(0, 1, 0, thre - 2 / n, '3b');

    cube.addmove(1, 0, 0, -999, 'x', 999, 4);
    cube.addmove(0, 0, 1, -999, 'y', 999, 4);
    cube.addmove(0, -1, 0, -999, 'z', 999, 4);


    let chara = ['二', '三', '四', '五', '六', '七'];
    cube.name = chara[n - 2] + '阶魔方';
    return cube;
}

function add2Move() {
    let text = document.getElementById('text' + this.label.toString()).value;
    if (text === '') return;
    for (let move of text.split(' ')) {
        if (move === '') continue;
        myCube[this.label].moveList.push(move);
    }
}

function displayCube(cube) {
    cube.camera = new THREE.PerspectiveCamera(55, 1.25, 0.1, 1000);
    cube.renderer = new THREE.WebGLRenderer();
    cube.renderer.setSize(500, 400);
    let newPanel = document.createElement('div');
    newPanel.className = 'panel panel-primary';
    let newBody = document.createElement('div');
    let newHeading = document.createElement('div');
    newBody.className = 'panel-body';
    newHeading.className = 'panel-heading';
    newHeading.textContent = cube.name;
    newBody.id = cnt.toString();
    newBody.align = 'center';
    document.getElementById('container').appendChild(newPanel);


    let newInputGroup = document.createElement('div');
    newInputGroup.className = 'input-group';
    newBody.appendChild(newInputGroup);
    let newInput = document.createElement('input');
    newInput.id = 'text' + cnt.toString();
    newInput.type = 'text';
    newInput.className = 'form-control';
    newInput.placeholder = '输入转动';
    newInputGroup.appendChild(newInput);
    let newSpan = document.createElement('span');
    newSpan.className = 'input-group-btn';
    newInputGroup.appendChild(newSpan);
    let newButton = document.createElement('button');
    newButton.label = cnt;
    newButton.className = 'btn btn-default';
    newButton.type = 'button';
    newButton.textContent = '确认';
    newButton.onclick = add2Move;
    newSpan.appendChild(newButton);



    newPanel.appendChild(newHeading);
    newPanel.appendChild(newBody);
    document.getElementById(cnt.toString()).appendChild(cube.renderer.domElement);

    cnt++;
    cube.camera.position = new THREE.Vector3(0, -2, 2);
    cube.camera.rotation.x = 1;
    cube.scene = new THREE.Scene();


    for (let piece of cube.pieces) {
        cube.scene.add(piece);
    }
    //cube.moveList = ['R', 'U', 'R\'', 'U\'', 'R\'', 'F', 'R2', 'U\'', 'R\'', 'U\'', 'R', 'U', 'R\'', 'F\''];

    cube.render = function () {
        requestAnimationFrame(cube.render);
        for (let piece of cube.pieces) {
            piece.children[0].geometry.verticesNeedUpdate = true;
            piece.children[1].geometry.verticesNeedUpdate = true;
        }
        cube.dMove();
        cube.renderer.render(cube.scene, cube.camera);
    };

    cube.render();
}

function addCube(n) {
    let newCube = NewCube(n);
    myCube.push(newCube);
    displayCube(newCube);
}

function addPyra() {
    let Pyra = NewPyramix();
    myCube.push(Pyra);
    displayCube(Pyra);
    Pyra.camera.position = new THREE.Vector3(1.5, -2, 2);
}

function addSkew() {
    let Skew = NewSkew();
    myCube.push(Skew);
    displayCube(Skew);
}

