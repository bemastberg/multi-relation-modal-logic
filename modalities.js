
const print = console.log

let worlds = {
    0: '',
    1: 'p',
    2: 'p',
    3: ''
}


// Function to evaluate in which worlds a given atomic variable
// is true
function atom(worlds, atomicVariable) {
    let valueTrue = new Set();
    for (let world = 0; world < Object.keys(worlds).length; world++) {
        if (worlds[world].includes(atomicVariable)) {
            valueTrue.add(world);
        }
    }
    return valueTrue
}


// Function that takes a set of worlds, a dict of relations, an agent
// (which determines which relation to be evaluated, default false for 
// evaluating relations with no agent) and
// a set of worlds where the formula to be evaluated by the diamond
// is true, and returns a set of worlds where each
// world has at least one successor in the given set of worlds
// (<>p is true in worlds which has at least one successor
// where p is true)
function diamond(worlds, relations, trueValuations, agent = false) {
    if (!agent) {
        var relation = relations;
    } else {
        var relation = relations[agent];
    }
    let valueTrue = new Set();
    for (const world of Object.keys(worlds)) {
        for (const successor of relation[world]) {
            if (trueValuations.has(successor)) {
                valueTrue.add(parseInt(world))
            }
        }
    }
    return valueTrue

}
// Takes the set of worlds, an obj of relations, an agent (which
// determines which relation to be evaluated, default false for 
// evaluating relations with no agent) and a set of worlds
// where the formula to be evaluated by the box is true, and
// returns the set of worlds whose set of transitions is a subset of
// the input set of worlds
// ([]p is true in worlds where p is true in every reachable world,
// or in worlds with no transitions)
function box(worlds, relations, trueValuations, agent = false) {
    if (!agent) {
        var relation = relations;
    } else {
        var relation = relations[agent];
    }
    let valueTrue = new Set();
    for (const world of Object.keys(worlds)) {
        if ([...relation[world]].every(val => trueValuations.has(val))) {
            valueTrue.add(parseInt(world))
        }

    }
    return valueTrue
}

//console.log(atom(worlds, 'p')) // evaluate p
//console.log(diamond(worlds, relations, atom(worlds, 'p'))) // evaluate <>p
//console.log(box(worlds, relation, atom(worlds, 'p'))) // evaluate []p
//print(diamond(worlds, relation, box(worlds, relation, atom(worlds, 'p')))) // evaluate <>[]p
//print(box(worlds, relation, diamond(worlds, relation, atom(worlds, 'p')))) // evaluate []<>p

// FURTHER RELATIONS //

let relations = new Object()
relations['a'] = new Object()
relations['b'] = new Object()
relations['a'][0] = new Set()
relations['a'][1] = new Set()
relations['a'][2] = new Set()
relations['a'][3] = new Set()
relations['b'][0] = new Set()
relations['b'][1] = new Set()
relations['b'][2] = new Set()
relations['b'][3] = new Set()

relations['a'][0].add(1)
relations['a'][0].add(2)
relations['a'][1].add(2)
relations['a'][1].add(3)
relations['a'][2].add(1)
relations['a'][2].add(3)
relations['a'][3].add(0)
relations['a'][3].add(1)
relations['a'][3].add(2)
relations['b'][0].add(2)
relations['b'][0].add(3)
relations['b'][1].add(1)
relations['b'][1].add(2)
relations['b'][2].add(2)
relations['b'][2].add(3)
relations['b'][3].add(0)
relations['b'][3].add(1)

// relations['c'] = new Object()
// relations['c'][0] = new Set()
// relations['c'][0].add(...new Set([...new Array(1, 2, 3, 4)]))




//console.log(diamond(worlds, relations, atom(worlds, 'p'), agent = 'b')) // evaluate <>p
//console.log(diamond(worlds, everybodyKnows(worlds, relations), atom(worlds, 'p')))



// intersection borrowed from https://stackoverflow.com/questions/37320296/how-to-calculate-intersection-of-multiple-arrays-in-javascript-and-what-does-e
function distributedKnowledge(worlds, relations) {
    let newRelation = new Object();
    for (const world of Object.keys(worlds)) {
        let toBeIntersected = new Array();
        for (const agent of Object.keys(relations)) {
            toBeIntersected.push([...relations[agent][world]]);
        }
        if (toBeIntersected.length > 0) {
            var intersectedWorld = new Set(toBeIntersected.reduce((a, b) => a.filter(c => b.includes(c))));
        } else { continue }
        newRelation[world] = intersectedWorld;
    }

    return newRelation;

}
//console.log(distributedKnowledge(worlds, relations)) // create distributed relation

// union of relations (everybody knows)
function everybodyKnows(w, r) {
    let newRelation = new Object();
    for (const world of Object.keys(w)) {
        let toBeUnionized = new Array();
        for (const agent of Object.keys(r)) {
            toBeUnionized.push(...r[agent][world]);
        }
        newRelation[world] = new Set(toBeUnionized);
    }
    return newRelation;

}

//console.log(everybodyKnows(worlds, relations))
//console.log(relation)

// Function that transitively closes the everybody knows-relation
// For each world, it takes each successor and adds any successors of the successor that is not already in the set of successors. 
function commonKnowledge(w, r) {
    let relation = everybodyKnows(w, r)
    let is_transitive = false;
    do {
        let changes = 0
        for (const world of Object.keys(relation)) {
            for (const successor of relation[world]) {
                const toBeAdded = new Set([...relation[successor]].filter(x => !relation[world].has(x)));
                if (toBeAdded.size > 0) {
                    relation[world].add(...toBeAdded);
                    changes++;
                }
            }
        }
        if (changes === 0) { is_transitive = true }
    }
    while (!is_transitive)
    return relation
}

function complement(w, r) {
    let cartesianProductOfDomain = new Object();
    let comp = new Set()
    let complemented = new Object()
    for (const world of Object.keys(w)) {
        comp.add(parseInt(world))
    }
    for (const world of Object.keys(w)) {
        cartesianProductOfDomain[world] = comp;
    }
    for (const world of Object.keys(cartesianProductOfDomain)) {
        const toBeAdded = new Set([...cartesianProductOfDomain[world]].filter(x => !r[world].has(x)));
        complemented[world] = toBeAdded
    }
    return complemented

}
console.log(complement(worlds, distributedKnowledge(worlds, relations)))

function inverse(w, r) {

}
let numbersGiven = false
function getModel() {

    let modelAgents = new Set()
    document.getElementById('frm1');
    if (!numbersGiven) {
        let numberOfWorlds = parseInt(document.getElementById('worlds').value);
        let numberOfAgents = parseInt(document.getElementById('agents').value);
        for (const agent of [...Array(numberOfAgents).keys()]) {
            // document.getElementById('inputAgent').innerHTML += "Agent: <input type='text' class='addAgent'><input type='button' value='Submit'>";
            // let agent = document.getElementsByClassName('addAgent').value;
            // modelAgents.add(agent)
            let input = document.createElement('input');
            input.setAttribute('type', 'text');
            input.setAttribute('class', 'addAgent')
            let btn = document.createElement('input');
            btn.setAttribute('type', 'button');
            btn.setAttribute('onclick', 'getModel()');
            btn.setAttribute('value', 'Submit')
            let parent = document.getElementById("inputAgent");
            parent.appendChild(input);
            parent.appendChild(btn);
        }
        numbersGiven = true;
    } else {
        parent = document.getElementById('inputAgent')
        modelAgents.add(document.getElementsByClassName('addAgent').value)
    }
    console.log(modelAgents)
}



export { diamond, box, atom, relations }


