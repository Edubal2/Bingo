import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getDatabase, ref, onValue, set } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyDQIg_gMD9Vq8W8FcrTYDRFernKJAUx9-8",
    authDomain: "bingo-dde4a.firebaseapp.com",
    databaseURL: "https://bingo-dde4a-default-rtdb.firebaseio.com",
    projectId: "bingo-dde4a",
    storageBucket: "bingo-dde4a.firebasestorage.app",
    messagingSenderId: "959558087813",
    appId: "1:959558087813:web:66f87cb0383dc4dca865ec"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

document.addEventListener('DOMContentLoaded', () => {
    const boardsContainer = document.getElementById('boardsContainer');
    const addPlayerBtn = document.getElementById('addPlayerBtn');
    const playerNameInput = document.getElementById('playerNameInput');
    const playerColorInput = document.getElementById('playerColorInput');
    const shareBtn = document.getElementById('shareBtn');
    const toast = document.getElementById('toast');
    const playerBoardTemplate = document.getElementById('playerBoardTemplate');

    let players = [];
    let currentRoomId = null;

    const winningLines = [
        [0, 1, 2, 3], [4, 5, 6, 7], [8, 9, 10, 11], [12, 13, 14, 15], // Rows
        [0, 4, 8, 12], [1, 5, 9, 13], [2, 6, 10, 14], [3, 7, 11, 15], // Cols
        [0, 5, 10, 15], [3, 6, 9, 12] // Diagonals
    ];

    function getCompletedLines(grid) {
        return winningLines.filter(line => line.every(index => grid[index]));
    }

    function celebrate() {
        if (typeof confetti === 'function') {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        }
    }

    // Initialize
    function init() {
        const hash = window.location.hash.substring(1);

        if (hash && hash.startsWith('room-')) {
            currentRoomId = hash;
        } else {
            // Generate a random room ID and set it in the URL
            currentRoomId = 'room-' + Math.random().toString(36).substring(2, 9);
            history.replaceState(null, null, '#' + currentRoomId);
        }

        listenToRoom(currentRoomId);
    }

    function listenToRoom(roomId) {
        const roomRef = ref(database, 'rooms/' + roomId + '/players');
        onValue(roomRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                // Firebase might return an object with keys instead of array depending on how it's saved/deleted
                players = Array.isArray(data) ? data : Object.values(data);
            } else {
                players = [];
            }
            renderAllBoards();
        });
    }

    function saveToFirebase() {
        if (!currentRoomId) return;
        const roomRef = ref(database, 'rooms/' + currentRoomId + '/players');
        set(roomRef, players).catch(error => {
            console.error("Error saving to Firebase: ", error);
            showToast("Error al guardar datos");
        });
    }

    // Add new player
    addPlayerBtn.addEventListener('click', () => {
        let name = playerNameInput.value.trim();
        const color = playerColorInput.value;

        if (!name) {
            name = `Jugador ${players.length + 1}`;
        }

        // Initialize 16 false values for the board
        const grid = Array(16).fill(false);

        players.push({ id: Date.now(), name, color, grid });
        playerNameInput.value = '';
        saveToFirebase();
    });

    // Enter key support for input
    playerNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addPlayerBtn.click();
        }
    });

    // Render all boards
    function renderAllBoards() {
        boardsContainer.innerHTML = '';
        players.forEach((player, playerIndex) => {
            const node = playerBoardTemplate.content.cloneNode(true);
            const card = node.querySelector('.player-card');
            const nameEl = node.querySelector('.player-name');
            const removeBtn = node.querySelector('.remove-player-btn');
            const gridEl = node.querySelector('.bingo-grid');
            const progressFill = node.querySelector('.progress-fill');
            const progressText = node.querySelector('.progress-text');

            nameEl.textContent = player.name;
            nameEl.style.color = player.color;

            // Remove player
            removeBtn.addEventListener('click', () => {
                card.style.transform = 'scale(0.8) translateY(20px)';
                card.style.opacity = '0';
                setTimeout(() => {
                    players.splice(playerIndex, 1);
                    saveToFirebase();
                }, 300);
            });

            // Count checked items
            let checkedCount = 0;

            const completedLines = getCompletedLines(player.grid);
            const winningCells = new Set(completedLines.flat());

            // Generate 16 cells
            const bingoWords = [
                "陈陈春 friend", "80's enjoyer", "Asistencia", "Foto Gypsy",
                "2010's enjoyer", "Solo Quest", "Street Fighter enjoyer", "curvă friend",
                "Foto con un vallero", "Guillem's pooping palace", "3 chupitos back to back", "Successful Song Request",
                "Ratear cubata", "Tiktok enjoyer", "Sergio fake hetero", "Fake extranjero"
            ];

            for (let i = 0; i < 16; i++) {
                const cell = document.createElement('div');
                cell.className = 'bingo-cell';
                cell.textContent = bingoWords[i];

                if (player.grid[i]) {
                    cell.classList.add('checked');
                    cell.style.backgroundColor = player.color;
                    cell.style.borderColor = player.color;
                    checkedCount++;
                }

                if (winningCells.has(i)) {
                    cell.classList.add('winning-cell');
                }

                cell.addEventListener('click', () => {
                    const beforeLines = getCompletedLines(player.grid).length;
                    player.grid[i] = !player.grid[i];
                    const afterLines = getCompletedLines(player.grid).length;

                    if (afterLines > beforeLines) {
                        celebrate();
                    }

                    saveToFirebase();
                });

                gridEl.appendChild(cell);
            }

            // Update Progress
            const progressPercentage = (checkedCount / 16) * 100;
            progressFill.style.width = `${progressPercentage}%`;
            progressFill.style.backgroundColor = player.color;
            progressText.textContent = `${checkedCount}/16`;

            // Bingo Win condition visual
            if (checkedCount === 16) {
                card.style.boxShadow = `0 0 30px ${player.color}55`;
                card.style.animation = 'pulse 2s infinite';
            }

            boardsContainer.appendChild(node);
        });
    }

    // Share state URL
    shareBtn.addEventListener('click', () => {
        if (players.length === 0) {
            showToast("Añade al menos un jugador primero");
            return;
        }

        const url = window.location.origin + window.location.pathname + '#' + currentRoomId;

        navigator.clipboard.writeText(url).then(() => {
            showToast("¡Enlace copiado! Compártelo para mostrar el progreso");
        }).catch(err => {
            console.error('Error al copiar: ', err);
            // Fallback for some browsers
            prompt("Copia este enlace:", url);
        });
    });

    function showToast(message) {
        toast.textContent = message;
        toast.classList.remove('hidden');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    }

    // Start
    init();
});
