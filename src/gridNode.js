/**
 * ĐỒ ÁN CƠ SỞ NGÀNH - TUẦN 1: MÔ HÌNH HÓA DỮ LIỆU KHO HÀNG & CẤU TRÚC NODE
 * Đề tài: Xây dựng ứng dụng mô phỏng hoạt động của robot di chuyển trong kho hàng
 * Sinh viên: Lê Hữu Hoài - MSSV: 110124067 - Lớp: DA24TTC
 * GVHD: TS. Nguyễn Nhất Lam
 */

// 1. Quy ước trạng thái của các ô trong mặt bằng kho hàng (2D Grid Map)[cite: 5, 8]
const CELL_STATE = {
    EMPTY: 0,       // Hành lang di chuyển trống
    RACK: 1,        // Kệ chứa hàng / Vật cản
    ROBOT_START: 2, // Vị trí xuất phát của Robot AGV/AMR
    PICKING_GOAL: 3 // Điểm lấy hàng (Đích)
};

// 2. Định nghĩa 4 hướng di chuyển vuông góc của Robot trong kho (Lên, Xuống, Trái, Phải)[cite: 5, 18]
const DIRECTIONS = [
    { dRow: -1, dCol: 0, name: "UP" },
    { dRow: 1,  dCol: 0, name: "DOWN" },
    { dRow: 0,  dCol: -1, name: "LEFT" },
    { dRow: 0,  dCol: 1, name: "RIGHT" }
];

// 3. Cấu trúc dữ liệu của một Ô trên lưới (Tương ứng 1 Đỉnh/Nút trong Đồ thị)[cite: 5, 8]
class GridNode {
    constructor(row, col, state = CELL_STATE.EMPTY) {
        this.row = row;
        this.col = col;
        this.state = state;

        this.g = Infinity;
        this.h = 0;
        this.f = Infinity;

        this.visited = false;
        this.parent = null;
    }

    resetAlgorithmData() {
        this.g = Infinity;
        this.h = 0;
        this.f = Infinity;
        this.visited = false;
        this.parent = null;
    }
}

// 4. Hàm tính khoảng cách Manhattan (Heuristic cho thuật toán A*)[cite: 5, 18]
function calculateManhattanDistance(nodeA, nodeB) {
    return Math.abs(nodeA.row - nodeB.row) + Math.abs(nodeA.col - nodeB.col);
}

// =========================================================================
// 5. KHỞI TẠO VÀ MÔ PHỎNG MẶT BẰNG NHÀ KHO TRỰC QUAN TRÊN GIAO DIỆN
// =========================================================================
const ROWS = 10;
const COLS = 14;
let warehouseMatrix = [];
let robotCoord = { row: 1, col: 10 }; 
let goalCoord = { row: 8, col: 10 };  

function initGridData() {
    warehouseMatrix = [];
    for (let r = 0; r < ROWS; r++) {
        let rowArray = [];
        for (let c = 0; c < COLS; c++) {
            rowArray.push(new GridNode(r, c, CELL_STATE.EMPTY));
        }
        warehouseMatrix.push(rowArray);
    }
}

function generateWarehouseLayout() {
    initGridData();
    const rackRows = [2, 3, 5, 6];
    const rackCols = [1, 2, 3, 5, 6, 7, 9, 10, 11];

    for (let r of rackRows) {
        for (let c of rackCols) {
            if ((r === robotCoord.row && c === robotCoord.col) ||
                (r === goalCoord.row && c === goalCoord.col)) {
                continue;
            }
            warehouseMatrix[r][c].state = CELL_STATE.RACK;
        }
    }

    warehouseMatrix[robotCoord.row][robotCoord.col].state = CELL_STATE.ROBOT_START;
    warehouseMatrix[goalCoord.row][goalCoord.col].state = CELL_STATE.PICKING_GOAL;

    renderWarehouseDOM();
    updateTelemetry();
}

function clearWarehouse() {
    initGridData();
    warehouseMatrix[robotCoord.row][robotCoord.col].state = CELL_STATE.ROBOT_START;
    warehouseMatrix[goalCoord.row][goalCoord.col].state = CELL_STATE.PICKING_GOAL;
    renderWarehouseDOM();
    updateTelemetry();
}

function renderWarehouseDOM() {
    const gridContainer = document.getElementById("warehouseGrid");
    if (!gridContainer) return;

    gridContainer.style.gridTemplateColumns = `repeat(${COLS}, 42px)`;
    gridContainer.innerHTML = "";

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const node = warehouseMatrix[r][c];
            const cellDiv = document.createElement("div");
            cellDiv.className = "grid-cell";

            if (node.state === CELL_STATE.RACK) {
                cellDiv.classList.add("cell-rack");
                cellDiv.innerHTML = "📦";
            } else if (node.state === CELL_STATE.ROBOT_START) {
                cellDiv.classList.add("cell-robot");
                cellDiv.innerHTML = "🤖";
            } else if (node.state === CELL_STATE.PICKING_GOAL) {
                cellDiv.classList.add("cell-goal");
                cellDiv.innerHTML = "🎯";
            }

            const coordSpan = document.createElement("span");
            coordSpan.className = "cell-coord";
            coordSpan.innerText = `${r},${c}`;
            cellDiv.appendChild(coordSpan);

            cellDiv.addEventListener("click", () => handleCellClick(r, c));
            gridContainer.appendChild(cellDiv);
        }
    }
}

function handleCellClick(r, c) {
    const mode = parseInt(document.getElementById("drawMode").value);
    const clickedNode = warehouseMatrix[r][c];

    if (mode === CELL_STATE.RACK) {
        if (clickedNode.state === CELL_STATE.ROBOT_START || clickedNode.state === CELL_STATE.PICKING_GOAL) return;
        clickedNode.state = (clickedNode.state === CELL_STATE.RACK) ? CELL_STATE.EMPTY : CELL_STATE.RACK;
    } else if (mode === CELL_STATE.ROBOT_START) {
        if (clickedNode.state === CELL_STATE.PICKING_GOAL) return;
        warehouseMatrix[robotCoord.row][robotCoord.col].state = CELL_STATE.EMPTY;
        robotCoord = { row: r, col: c };
        clickedNode.state = CELL_STATE.ROBOT_START;
    } else if (mode === CELL_STATE.PICKING_GOAL) {
        if (clickedNode.state === CELL_STATE.ROBOT_START) return;
        warehouseMatrix[goalCoord.row][goalCoord.col].state = CELL_STATE.EMPTY;
        goalCoord = { row: r, col: c };
        clickedNode.state = CELL_STATE.PICKING_GOAL;
    }

    renderWarehouseDOM();
    updateTelemetry();
}

// Kiểm tra xem đường đi có bị kệ hàng (RACK) chặn kín hay không[cite: 18]
function checkPathReachable() {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            warehouseMatrix[r][c].resetAlgorithmData();
        }
    }

    const startNode = warehouseMatrix[robotCoord.row][robotCoord.col];
    const goalNode = warehouseMatrix[goalCoord.row][goalCoord.col];

    let queue = [startNode];
    startNode.visited = true;

    while (queue.length > 0) {
        let current = queue.shift();

        if (current.row === goalNode.row && current.col === goalNode.col) {
            return true;
        }

        for (let dir of DIRECTIONS) {
            let nextRow = current.row + dir.dRow;
            let nextCol = current.col + dir.dCol;

            if (nextRow >= 0 && nextRow < ROWS && nextCol >= 0 && nextCol < COLS) {
                let neighbor = warehouseMatrix[nextRow][nextCol];
                if (neighbor.state !== CELL_STATE.RACK && !neighbor.visited) {
                    neighbor.visited = true;
                    queue.push(neighbor);
                }
            }
        }
    }
    return false;
}

function updateTelemetry() {
    const startNode = warehouseMatrix[robotCoord.row][robotCoord.col];
    const goalNode = warehouseMatrix[goalCoord.row][goalCoord.col];

    const hValue = calculateManhattanDistance(startNode, goalNode);
    const isReachable = checkPathReachable();

    startNode.g = 0;
    startNode.h = hValue;
    startNode.f = startNode.g + startNode.h;

    const robotPosEl = document.getElementById("robotPos");
    const goalPosEl = document.getElementById("goalPos");
    const manhattanEl = document.getElementById("manhattanVal");

    if (robotPosEl) robotPosEl.innerText = `(${startNode.row}, ${startNode.col})`;
    if (goalPosEl) goalPosEl.innerText = `(${goalNode.row}, ${goalNode.col})`;

    if (manhattanEl) {
        if (isReachable) {
            manhattanEl.innerHTML = `${hValue} bước`;
            manhattanEl.style.color = "#1e3a8a";
        } else {
            manhattanEl.innerHTML = `${hValue} bước <span style="color: #dc2626; font-weight: bold;">(❌ Không tìm thấy đường đi - Bị kệ hàng chặn kín!)</span>`;
        }
    }

    console.clear();
    console.log("=== KIỂM TRA MÔ HÌNH HÓA DỮ LIỆU TUẦN 1 ===");
    console.log("Vị trí Robot (Start):", `(${startNode.row}, ${startNode.col})`);
    console.log("Vị trí Kệ lấy hàng (Goal):", `(${goalNode.row}, ${goalNode.col})`);
    console.log("Khoảng cách Manhattan h(n):", startNode.h, "bước di chuyển");
    if (!isReachable) {
        console.warn("CẢNH BÁO: Không tìm thấy đường đi! Kệ hàng đã chắn kín lối vào Đích.");
    } else {
        console.log("Trạng thái đường đi: Hợp lệ (Có lối thông tới đích).");
    }
}

window.onload = () => {
    generateWarehouseLayout();
};