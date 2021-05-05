const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

const cells = 6;
const width = 600;
const height = 600;

const unitLength = width / cells;

const engine = Engine.create();
engine.world.gravity.y = 0;
const { world } = engine;
const render = Render.create({
    element: document.body,
    engine: engine,
    options: {
        wireframes: true,
        width,
        height
    }
});

Render.run(render);
Runner.run(Runner.create(), engine);


// Walls
const walls = [
    Bodies.rectangle(width / 2, 0, width, 2, { isStatic: true }),
    Bodies.rectangle(width / 2, height, width, 2, { isStatic: true }),
    Bodies.rectangle(0, height / 2, 2, height, { isStatic: true }),
    Bodies.rectangle(width, height / 2, 2, height, { isStatic: true })
];

World.add(world, walls)

// Maze Generation

const shuffle = (arr) => {
    let counter = arr.length;
    while (counter > 0) {
        const index = Math.floor(Math.random() * counter);

        counter--;

        const temp = arr[counter];
        arr[counter] = arr[index];
        arr[index] = temp;
    }
    return arr;
};

const grid = Array(cells)
    .fill(null)
    .map(() => Array(cells).fill(false));


const verticals = Array(cells)
    .fill(null)
    .map(() => Array(cells - 1).fill(false));

const horizontals = Array(cells - 1)
    .fill(null)
    .map(() => Array(cells).fill(false));

const startRow = Math.floor(Math.random() * cells);
const startColumn = Math.floor(Math.random() * cells);

const stepThroughCell = (row, column) => {
    //If I have visited the cell at [row, column], return
    if (grid[row][column]) {
        return;
    }
    // Mark this cell as being visited
    grid[row][column] = true;
    // Assemble randomly-ordered ist of neighbors
    const neighbors = shuffle([
        [row - 1, column, 'up'],
        [row, column + 1, 'right'],
        [row + 1, column, 'down'],
        [row, column - 1, 'left']
    ]);
    
    //For each neighbor ...
    for(let neighbor of neighbors) {
        const [nextRow, nextColumn, direction] = neighbor;

    // See if that neighbor is out of bounds
        if( 
            nextRow < 0 || 
            nextRow >= cells || 
            nextColumn < 0 || 
            nextColumn >= cells 
        ) {
            continue;
        }
    // if we have visited that neighbor, continue to next neighbor
        if (grid[nextRow][nextColumn]) {
            continue;
        }
    //remove a wall from either horizontals or verticals
        if (direction === 'left') {
            verticals[row][column-1] = true;
        } else if (direction ==='right') {
            verticals[row][column] = true;
        } else if (direction ==='up') {
            horizontals[row-1][column] = true;
        } else if (direction ==='down') {
            horizontals[row][column] = true;
        }
        //visit that next cell
        stepThroughCell(nextRow, nextColumn)
    }
    
};

stepThroughCell(1, 1)


horizontals.forEach((row, rowIndex) => {
    row.forEach((open, columnIndex) => {
        if (open) {
            return;
        }
        
        const wall = Bodies.rectangle(
            columnIndex * unitLength + unitLength / 2,
            rowIndex * unitLength + unitLength,
            unitLength,
            1,
            {
                label: 'wall',
                isStatic: true
            } 
        );
        World.add(world, wall)
    })
});
verticals.forEach((row, rowIndex) => {
    row.forEach((open, columnIndex) => {
        if(open) {
            return;
        }
        const wall = Bodies.rectangle(
            columnIndex * unitLength + unitLength,
            rowIndex * unitLength + unitLength / 2,
            1,
            unitLength,
            {
                label: 'wall',
                isStatic: true
            }
        );
        World.add(world, wall)
    })
})
const goal = Bodies.rectangle(
    width - unitLength / 2,
    height - unitLength / 2,
    unitLength * 0.7,
    unitLength * 0.7,
    {
        isStatic: true,
        label: 'goal'
    }

);
World.add(world, goal);

const ball = Bodies.circle(
    unitLength / 2,
    unitLength / 2,
    unitLength / 3,
    {
        label: 'ball'
    }
)
World.add(world, ball);

document.addEventListener('keydown', event => {
    const {x, y} = ball.velocity;
    
    if (event.key === 'w' || event.key === 'ArrowUp') {
        Body.setVelocity(ball, {x, y: y - 5})
    }
    if (event.key === 'd' || event.key === 'ArrowRight') {
        Body.setVelocity(ball, {x: x + 5, y})
    }
    if (event.key === 's' || event.key === 'ArrowDown') {
        Body.setVelocity(ball, {x, y: y + 5})
    }
    if (event.key === 'a' || event.key === 'ArrowLeft') {
        Body.setVelocity(ball, {x: x - 5, y})
    }
});

// Win Condition

Events.on(engine, 'collisionStart', event => {
    event.pairs.forEach(collision => {
        const labels = ['ball', 'goal'];
        if (
            labels.includes(collision.bodyA.label) && 
            labels.includes(collision.bodyB.label)
        ) {
            world.gravity.y = 0.5;
            world.bodies.forEach(body=> {
                if (body.label === 'wall') {
                    Body.setStatic(body, false);
                }
            })
        }
    })
});