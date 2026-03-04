document.addEventListener('DOMContentLoaded', () => {
    const boardsContainer = document.getElementById('boardsContainer');
    const addPlayerBtn = document.getElementById('addPlayerBtn');
    const playerNameInput = document.getElementById('playerNameInput');
    const playerColorInput = document.getElementById('playerColorInput');
    const shareBtn = document.getElementById('shareBtn');
    const toast = document.getElementById('toast');
    const playerBoardTemplate = document.getElementById('playerBoardTemplate');

    let players = [];

    // Initialize
    function init() {
        // Check if there's shared data in URL
        const hash = window.location.hash.substring(1);
        if (hash) {
            try {
                const decoded = atob(hash);
                players = JSON.parse(decoded);
                // Clear hash for clean URL
                history.replaceState(null, null, ' ');
            } catch (e) {
                console.error("Error validando el enlace compartido", e);
                loadLocal();
            }
        } else {
            loadLocal();
        }

        renderAllBoards();
    }

    function loadLocal() {
        const saved = localStorage.getItem('bingoPlayers');
        if (saved) {
            players = JSON.parse(saved);
        }
    }

    function saveLocal() {
        localStorage.setItem('bingoPlayers', JSON.stringify(players));
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
        saveLocal();
        renderAllBoards();
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
                    saveLocal();
                    renderAllBoards();
                }, 300);
            });

            // Count checked items
            let checkedCount = 0;

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

                cell.addEventListener('click', () => {
                    player.grid[i] = !player.grid[i];
                    saveLocal();
                    renderAllBoards(); // Re-render to update state & progress
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

        const data = btoa(JSON.stringify(players));
        const url = window.location.origin + window.location.pathname + '#' + data;

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
