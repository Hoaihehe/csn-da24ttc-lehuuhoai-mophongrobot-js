
// 1. Quy ước trạng thái của các ô trong mặt bằng kho hàng (2D Grid Map)
const CELL_STATE = {
    EMPTY: 0,       // Hành lang di chuyển (Lối đi trống)
    RACK: 1,        // Kệ chứa hàng / Vật cản cố định
    ROBOT_START: 2, // Vị trí xuất phát của Robot AGV/AMR
    PICKING_GOAL: 3 // Điểm lấy/trả hàng (Đích)
};

// 2. Định nghĩa 4 hướng di chuyển vuông góc của Robot trong kho (Lên, Xuống, Trái, Phải)
const DIRECTIONS = [
    { dRow: -1, dCol: 0, name: "UP" },
    { dRow: 1,  dCol: 0, name: "DOWN" },
    { dRow: 0,  dCol: -1, name: "LEFT" },
    { dRow: 0,  dCol: 1, name: "RIGHT" }
];

// 3. Cấu trúc dữ liệu của một Ô trên lưới (Tương ứng 1 Đỉnh/Nút trong Đồ thị)
class GridNode {
    constructor(row, col, state = CELL_STATE.EMPTY) {
        this.row = row;                 // Tọa độ hàng
        this.col = col;                 // Tọa độ cột
        this.state = state;             // Trạng thái ô (0, 1, 2, 3)

        // Các tham số phục vụ thuật toán BFS, Dijkstra và A*
        this.g = Infinity;              // Chi phí thực tế từ điểm Start đến ô hiện tại
        this.h = 0;                     // Chi phí ước lượng Heuristic từ ô hiện tại đến Goal
        this.f = Infinity;              // Tổng chi phí đánh giá: f(n) = g(n) + h(n)
        
        this.visited = false;           // Đánh dấu ô đã được khảo sát (Closed Set)
        this.parent = null;             // Con trỏ lưu vết ô cha để truy hồi đường đi ngắn nhất
    }

    // Đặt lại trạng thái thuật toán khi chạy lại mô phỏng
    resetAlgorithmData() {
        this.g = Infinity;
        this.h = 0;
        this.f = Infinity;
        this.visited = false;
        this.parent = null;
    }
}

// 4. Hàm tính khoảng cách Manhattan (Heuristic cho thuật toán A*)
function calculateManhattanDistance(nodeA, nodeB) {
    return Math.abs(nodeA.row - nodeB.row) + Math.abs(nodeA.col - nodeB.col);
}

// --- CHẠY THỬ NGHIỆM KIỂM TRA MÔ HÌNH DỮ LIỆU (TEST TUẦN 1) ---
const startNode = new GridNode(2, 3, CELL_STATE.ROBOT_START);
const goalNode = new GridNode(8, 10, CELL_STATE.PICKING_GOAL);
startNode.g = 0;
startNode.h = calculateManhattanDistance(startNode, goalNode);
startNode.f = startNode.g + startNode.h;

console.log("=== KIỂM TRA MÔ HÌNH HÓA DỮ LIỆU TUẦN 1 ===");
console.log("Vị trí Robot (Start):", `(${startNode.row}, ${startNode.col})`);
console.log("Vị trí Kệ lấy hàng (Goal):", `(${goalNode.row}, ${goalNode.col})`);
console.log("Khoảng cách Manhattan h(n):", startNode.h, "bước di chuyển");
console.log("Đã kết nối JS thành công!");