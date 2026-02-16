import { io } from "socket.io-client";

const socket = io("http://localhost:3000");

socket.on("connect", () => {
    console.log("Connected to server");

    // Create tournament
    socket.emit("create_tournament", { type: "501", legsToWin: 1, settings: { doubleOut: true, requirePin: false } }, (res) => {
        if (!res.success) throw new Error("Create failed: " + res.error);
        console.log("Tournament created");

        // Add players
        socket.emit("add_player", { name: "P1" }, () => { });
        socket.emit("add_player", { name: "P2" }, () => { });

        setTimeout(() => {
            // Start tournament
            socket.emit("start_tournament", {}, (res) => {
                const matchId = res.tournament.rounds[0][0].id;
                console.log("Match started: " + matchId);

                // Start match
                socket.emit("start_match", { matchId }, () => {
                    console.log("Match active");

                    // Throw 20
                    socket.emit("throw_dart", { matchId, value: 20, multiplier: 3 }, (res) => { // 60
                        console.log("Throw 1: 60.");
                        console.log("Checkout: " + res.checkout);

                        // Undo throw 1
                        socket.emit("undo_throw", { matchId }, (resUndo) => {
                            console.log("Undo success: " + resUndo.success);
                            if (!resUndo.success) {
                                console.log("Undo Error: " + resUndo.error);
                            } else {
                                console.log("Checkout after Undo: " + resUndo.checkout);
                            }

                            // Exit
                            process.exit(0);
                        });
                    });
                });
            });
        }, 500);
    });
});
