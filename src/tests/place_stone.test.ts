import { Board, from_custom_state, main, ResolvedGameState } from ".."

test("既に埋まっている", () => {
    expect(() => main([
        { "piece_phase": { "side": "黒", "to": ["３", "五"], "prof": "ポ" }, "stone_to": ["１", "九"] },

    ])).toThrowError(`黒が１九に碁石を置こうとしていますが、１九のマスは既に埋まっています`);
});

test("自殺", () => {
    expect(() => main([
        { "piece_phase": { "side": "黒", "to": ["３", "五"], "prof": "ポ" }, "stone_to": ["４", "二"] },

    ])).toThrowError(`黒が４二に碁石を置こうとしていますが、打った瞬間に取られてしまうのでここは着手禁止点です`);
});

// 公式ルール（shogoss-comprehensive-rules.md §4）：
// 「駒フェーズの後に，すぐに相手の石・駒の囲みを判定し囲まれていれば除去される」
// 駒フェイズの着手で相手の石を四方から囲むと、石フェイズが始まる前にその石は取られる。
// よって、空いたそのマスへ自分の石を打つことは合法。
test("駒フェイズで相手の石を囲んで取った直後、そのマスに石を置ける", () => {
    const empty_row = (): null[] => [null, null, null, null, null, null, null, null, null];
    const board = [
        empty_row(), empty_row(), empty_row(),
        empty_row(), empty_row(), empty_row(),
        empty_row(), empty_row(), empty_row(),
    ] as unknown as Board;

    // board[行index][列index]。行は一〜九 (0〜8)、列は９〜１ (0〜8)。
    // ４七 → (行index=6, 列index=5) に白ビ（５六へ一マス斜めで到達できる）
    board[6]![5] = { type: "ス", side: "白", prof: "ビ", never_moved: false };
    // ５五 → (4, 4) に黒石（囲まれて取られる対象）
    board[4]![4] = { type: "碁", side: "黒" };
    // 残りの三方を白石で埋める
    board[3]![4] = { type: "碁", side: "白" }; // ５四
    board[4]![5] = { type: "碁", side: "白" }; // ４五
    board[4]![3] = { type: "碁", side: "白" }; // ６五
    // 両キング（除去判定で王が消えないように）
    board[0]![4] = { type: "王", side: "白", prof: "キ", never_moved: false, has_moved_only_once: false };
    board[8]![4] = { type: "王", side: "黒", prof: "キ", never_moved: false, has_moved_only_once: false };

    const initial: ResolvedGameState = {
        phase: "resolved",
        board,
        hand_of_black: [],
        hand_of_white: [],
        who_goes_next: "白",
    };

    // 白ビが４七→５六へ斜め移動。着地で５五の黒石は四方を白で囲まれ、
    // 石フェイズ前に除去される。続いて白が５五に石を打てる。
    const result = from_custom_state([
        { piece_phase: { side: "白", to: ["５", "六"], prof: "ビ", from: ["４", "七"] }, stone_to: ["５", "五"] },
    ], initial);

    expect(result.phase).toBe("resolved");
    if (result.phase !== "resolved") return;

    expect(result.board[4]![4]).toEqual({ type: "碁", side: "白" });
    expect(result.board[5]![4]).toEqual({ type: "ス", side: "白", prof: "ビ", never_moved: false });
    expect(result.who_goes_next).toBe("黒");
});
