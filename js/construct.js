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
    constructor(v, f) {
        this.pieces = [];
        this.moveData = {};
        this.moveList = [];
        this.currentMove = {move: '', prog: 0};
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
            mesh.children[1].material.wireframeLinewidth = 10;
            this.pieces.push(mesh);
        }
    }

    fill(x, y, z, v, c) {
        for (let i = 0; i < this.pieces.length; i++) {
            this.pieces[i].children[0].geometry.computeCentroids();
            let cal = this.pieces[i].children[0].geometry.faces[0].centroid.dot(new THREE.Vector3(x, y, z));
            if (Math.abs(cal - v) < 0.0001) {
                let mat = new THREE.MeshBasicMaterial({color: c});
                mat.side = THREE.DoubleSide;
                this.pieces[i].children[0].material = mat;
            }
        }
    }

    dMove(gra) {
        if (this.currentMove.prog === 0) {
            if (this.moveList.length === 0) return;
            this.currentMove = {move: this.moveList[0], prog: gra};
            this.moveList = this.moveList.slice(1,);
        }
        let move = this.currentMove.move;
        let x = this.moveData[move].x;
        let y = this.moveData[move].y;
        let z = this.moveData[move].z;
        let v = this.moveData[move].v;
        let d = this.moveData[move].d;
        for (let i = 0; i < this.pieces.length; i++) {
            this.pieces[i].children[0].geometry.computeCentroids();
            if (this.pieces[i].children[0].geometry.faces[0].centroid.dot(new THREE.Vector3(x, y, z)) >= v) {
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
        this.currentMove.prog -= 1;
    }

    addmove(x, y, z, v, move) {
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
            if (centroid.dot(new THREE.Vector3(x, y, z)) >= v) {
                centroid.subSelf(this.center);
                let vec = new THREE.Vector3();
                vec.cross(centroid, new THREE.Vector3(x, y, z));
                pieces.push({len: vec.length(), v: vec, id: i});
            }
        }
        pieces.sort((a, b) => a.len - b.len);

        let lenmap = {};
        for (let piece of pieces) {
            let piecelen = Math.round(piece.len * 1000);
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
        let g = 0;
        for (let i in lenmap) {
            if (lenmap[i].length === 1) delete lenmap[i];
            else {
                lenmap[i].sort((a, b) => a.angle - b.angle);
                g = gcd(g, lenmap[i].length);
            }
        }
        this.moveData[move] = {x: x, y: y, z: z, v: v, d: 1 / g};
        this.moveData[move + '2'] = {x: x, y: y, z: z, v: v, d: 2 / g};
        this.moveData[move + '\''] = {x: x, y: y, z: z, v: v, d: - 1 / g};
        this.moveData[move + '\'2'] = {x: x, y: y, z: z, v: v, d: - 2 / g};
    }

}

let green = 0x00ff00;
let blue = 0x0000ff;
let red = 0xff0000;
let orange = 0xffa500;
let white = 0xeeeeee;
let yellow = 0xffff00;


function NewPyramix() {
    let height = Math.sqrt(6) / 3;
    let ax1 = vecMulScal(new THREE.Vector3(1, 0, 0), 1 / 3);
    let ax2 = vecMulScal(new THREE.Vector3(1 / 2, Math.sqrt(3) / 2, 0), 1 / 3);
    let ax3 = vecMulScal(new THREE.Vector3(1 / 2, Math.sqrt(3) / 6, height), 1 / 3);
    let v = [];
    let f = [];
    function work(o, base1, base2) {
        for (let i = 0; i < 4; i++)
            for (let j = 0; j < 4; j++) {
                if (i + j <= 2) {
                    cnt = v.length;
                    v.push(vecAddVec(o, vecAddVec(vecMulScal(base1, i), vecMulScal(base2, j))));
                    v.push(vecAddVec(o, vecAddVec(vecMulScal(base1, i + 1), vecMulScal(base2, j))));
                    v.push(vecAddVec(o, vecAddVec(vecMulScal(base1, i), vecMulScal(base2, j + 1))));
                    f.push(new THREE.Face3(cnt, cnt + 1, cnt + 2));
                }
                if (i >= 1 && j >= 1 && i + j >= 2 && i + j <= 3) {
                    cnt = v.length;
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
    pyra.addmove(-ax123.x, -ax123.y, -ax123.z, - 2 * height / 3, 'L');
    pyra.addmove(-ax13.x, -ax13.y, -ax13.z, height / 3, 'B');
    pyra.addmove(ax23.x, ax23.y, ax23.z, height / 3, 'R');
    pyra.addmove(0, 0, 1, height / 3, 'U');
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
    cube.addmove(1, 0, 0, 1 / 2 - 1 / n, 'R');
    cube.addmove(-1, 0, 0, 1 / 2 - 1 / n, 'L');
    cube.addmove(0, 0, 1, 1 / 2 - 1 / n, 'U');
    cube.addmove(0, 0, -1, 1 / 2 - 1 / n, 'D');
    cube.addmove(0, -1, 0, 1 / 2 - 1 / n, 'F');
    cube.addmove(0, 1, 0, 1 / 2 - 1 / n, 'B');
    cube.addmove(1, 0, 0, 1 / 2 - 2 / n, 'r');
    cube.addmove(-1, 0, 0, 1 / 2 - 2 / n, 'l');
    cube.addmove(0, 0, 1, 1 / 2 - 2 / n, 'u');
    cube.addmove(0, 0, -1, 1 / 2 - 2 / n, 'd');
    cube.addmove(0, -1, 0, 1 / 2 - 2 / n, 'f');
    cube.addmove(0, 1, 0, 1 / 2 - 2 / n, 'b');
    return cube;
}