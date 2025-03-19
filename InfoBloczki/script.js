let json

fetch("questions.json")
    .then(response => response.json())
    .then(data => json = data)

function setStorage(score, name) {
    let highestScore = {
        score: score,
        name: name
    }
    localStorage.setItem("highestScore", JSON.stringify(highestScore))
}

function getStorage() {
    return JSON.parse(localStorage.getItem("highestScore"))
}

document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.querySelector("canvas");
    const ctx = canvas.getContext('2d');

    let hs = getStorage()
    if (hs != null) {
        document.getElementById("highestscore").hidden = false
        document.getElementById("highestscore").innerHTML = `Najwyższy wynik ma ${hs["name"]} z wynikiem ${hs["score"]}`
    } else {
        document.getElementById("highestscore").hidden = true
    }

    const displayMessage = (params) => {
        ctx.fillStyle = "black";
        ctx.globalAlpha=0.75;
        ctx.fillRect(0, canvas.height/2-30, canvas.width, 60);

        ctx.globalAlpha=1;
        ctx.fillStyle="White";
        ctx.font="36px roboto";
        ctx.textAlign="center";
        ctx.textBaseline="middle";
        ctx.fillText(params, canvas.width/2, canvas.height/2)
    }
    displayMessage("START")

    const blocks={
        "O": [[1, 1], [1, 1]],
        "T": [[1, 0], [1, 1], [1, 0]],
        "L": [[1, 0,], [1, 0], [1, 1]],
        "J": [[0, 0, 1], [1, 1, 1]],
        "I": [[1, 1, 1, 1]],
        "S": [[1, 1, 0], [0, 1, 1]],
        "Z": [[0, 1, 1], [1, 1, 0]],
    }

    const colors = {
        "O": "red",
        "T": "blue",
        "L": "green",
        "J": "yellow",
        "I": "orange",
        "S": "purple",
        "Z": "indigo",
    }
    
    const grid=30;
    const rows = Math.round(canvas.height/grid);
    const columns = Math.round(canvas.width/grid);
    let board = Array.from({length:rows}, () => Array(columns).fill(0))
    let running = false;
    let timerId;
    let score = 0
    let answering = false
    let can_restart = true

    

    window.addEventListener("keydown", (e) => {
        if((e.key==" " || e.code=="Space") && !running && can_restart) {
            answering = false
            running = true;
            board.forEach((row) => row.fill(0))
            score = 0
            newBlock();
            timerId = setInterval(gameLoop, 250);
        }
    })

    

    function newBlock() {
        const types = Object.keys(blocks);
        const type = types[Math.floor(Math.random() * types.length)];

        currentBlock = {
            shape: blocks[type],
            x:0,
            y:0,
            type,
        };
    }

    function draw() {
        if (running) {
            drawBoard();

            drawBlock(currentBlock.shape, currentBlock.x, currentBlock.y)
        };
    };

    function drawBoard() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let y=0; y<rows; y++) {
            for (let x=0; x<columns; x++) {
                if (board[y][x]) {
                    drawSquare(x, y, board[y][x])
                }
            }
        }
    };

    function drawSquare(x,y,color){
        ctx.fillStyle=color;
        ctx.fillRect(x*grid, y*grid, grid, grid);
        ctx.strokeStyle = "#333";
        ctx.strokeRect = (x*grid, y*grid, grid, grid);
    }

    function drawBlock(block, offsetX, offsetY) {
        block.forEach((row, y) => {
            row.forEach((value, x)=>{
                if (value){
                    drawSquare(x+offsetX, y+offsetY, colors[currentBlock.type]);
                }
            })
        });
    }

    function gameLoop() {
        if (running) {
            draw();
            updateScore()

            if (!answering) {
                moveDown();
            }
        }
    }

    function updateScore() {
        document.getElementById("score").innerHTML = `Wynik: ${score}`
    }

    function collisionDetection(block,offsetX, offsetY) {
        return block.some((row, y) => {
            return row.some((value, x) => {
                if(value){
                    const newX= x + offsetX
                    const newY = y + offsetY
                    return (
                        newX < 0 || newX >= columns || newY >= rows|| board[newY][newX]
                    )
                }
                return false
            })
        })
    };

    document.addEventListener("keydown", (e) => {
        if (running){
            if (e.key == "ArrowLeft"){
                if(!collisionDetection(currentBlock.shape, currentBlock.x-1, currentBlock.y) && !answering) {
                    currentBlock.x--
                }
            } else if (e.key == "ArrowRight") {
                if(!collisionDetection(currentBlock.shape, currentBlock.x+1, currentBlock.y) && !answering) {
                    currentBlock.x++
                }
            } else if (e.key == "ArrowDown") {
                if(!collisionDetection(currentBlock.shape, currentBlock.x, currentBlock.y + 1) && !answering) {
                    moveDown()
                }
            } else if (e.keyCode == 68) {
                if(!collisionDetection(currentBlock.shape, currentBlock.x, currentBlock.y) && !answering) {
                    rotateBlock()
                }
            }
        }
    })
    
    function rotateMatrix(matrix) {
        return matrix[0].map((_,i) => matrix.map((row) => row[i]).reverse())
    }

    function rotateBlock() {
        const tempShape = currentBlock.shape

        currentBlock.shape = rotateMatrix(tempShape)
    }

    function mergeBlocks() {
        currentBlock.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    board[y + currentBlock.y][x + currentBlock.x] = colors[currentBlock.type]
                }
            })
        })
        checkLines()
    }

    function checkLines() {
        for (let y = rows - 1; y >= 0; y--) {
            if (board[y].every((cell) => cell)) {
                board.splice(y, 1)
                board.unshift(Array(columns).fill(0))
                score += 100
            }
        }
    }

    function getScore() {
        canvas.hidden = true
        document.getElementById("highscore").hidden = false

        document.getElementById("submit").onclick = function() {
            setStorage(score, document.getElementById("name").value)
            canvas.hidden = false
            document.getElementById("highscore").hidden = true
            can_restart = true
            location.reload()
        }
    }

    function moveDown() {
        if(!collisionDetection(currentBlock.shape, currentBlock.x, currentBlock.y + 1) && !answering) {
            currentBlock.y += 1
        } else {
            if (collisionDetection(currentBlock.shape, currentBlock.x, currentBlock.y)) {
                running = false;
                if (hs != null) {
                    if (score > hs.score) {
                        can_restart = false
                        getScore();
                    }
                } else {
                    can_restart = false
                    getScore();
                }
                clearInterval(timerId)
                displayMessage("GAME OVER")
            }
            giveQuestion();
        }
    }

    function giveQuestion() {
        answering = true

        document.getElementById("questionbox").hidden = false
        let questiontext = document.getElementById("question")

        let A = document.getElementById("a")
        let B = document.getElementById("b")
        let C = document.getElementById("c")
        let D = document.getElementById("d")

       let num = Math.floor(Math.random() * (Object.keys(json).length - 0))
       console.log(num)

        A.innerHTML = json[num].A
        B.innerHTML = json[num].B
        C.innerHTML = json[num].C
        D.innerHTML = json[num].D
        
        questiontext.innerHTML = json[num].question
        let answer = json[num].answer

        A.onclick = function() {
            if (answer == "A") {
                mergeBlocks()
                newBlock()
                answering = false;
                document.getElementById("questionbox").hidden = true
            }
        }
        B.onclick = function() {
            if (answer == "B") {
                mergeBlocks()
                newBlock()
                answering = false;
                document.getElementById("questionbox").hidden = true
            }
        }
        C.onclick = function() {
            if (answer == "C") {
                mergeBlocks()
                newBlock()
                answering = false;
                document.getElementById("questionbox").hidden = true
            }
        }
        D.onclick = function() {
            if (answer == "D") {
                mergeBlocks()
                newBlock()
                answering = false;
                document.getElementById("questionbox").hidden = true
            }
        }
    }
});
