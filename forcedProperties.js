//import { relations } from "./parser_test.js";
import { fromD3js } from "./toD3Data.js";
import { links, nodes } from "./app.js";

// Create an object which stores the added transitions
let forcedTransitions = new Object()
forcedTransitions["Transitive"] = new Array();
forcedTransitions["Symmetric"] = new Array();
forcedTransitions["Reflexive"] = new Array();

let worlds = fromD3js(links, nodes)[0]

// Functions to implement assumed reflexivity, symmetry and transitivity.
// The added transitions are stored in object forcesTransitions as arrays.
// Example: [agent, sourceWorld, targetWorld]

function forceReflexivity() {
    let relations = fromD3js(links, nodes)[1]
    let reflexiveRelations = relations;
    for (const agent of Object.keys(reflexiveRelations)) {
        for (const world of Object.keys(reflexiveRelations[agent])) {
            if (!reflexiveRelations[agent][world].includes(parseInt(world))) {
                reflexiveRelations[agent][world].push(parseInt(world));
                forcedTransitions["Reflexive"].push([agent, world, parseInt(world)]);
                for (const node of nodes) {
                    node.reflexive = true;
                }
            }
        }
    }
    return reflexiveRelations;

}
function forceSymmetry() {
    let relations = fromD3js(links, nodes)[1]
    let symmetricRelations = relations;
    for (const agent of Object.keys(symmetricRelations)) {
        for (const world of Object.keys(symmetricRelations[agent])) {
            for (const successor of symmetricRelations[agent][world]) {
                if (!symmetricRelations[agent][successor].includes(parseInt(world))) {
                    symmetricRelations[agent][successor].push(parseInt(world));
                    forcedTransitions["Symmetric"].push([agent, successor, parseInt(world)]);
                }
            }
        }
    }
    return symmetricRelations;
}
function forceTransitivity() {
    let relations = fromD3js(links, nodes)[1]
    let transitiveRelations = relations;
    let countedAdditions;
    do {
        countedAdditions = 0;
        for (const agent of Object.keys(transitiveRelations)) {
            for (const world of Object.keys(transitiveRelations[agent])) {
                for (const successor of transitiveRelations[agent][world]) {
                    for (const successorOfSuccessor of transitiveRelations[agent][successor]) {
                        if (!transitiveRelations[agent][world].includes(parseInt(successorOfSuccessor))) {
                            transitiveRelations[agent][world].push(parseInt(successorOfSuccessor));
                            forcedTransitions["Transitive"].push([agent, parseInt(world), parseInt(successorOfSuccessor)])
                            countedAdditions++;
                        }
                    }
                }
            }
        }
    } while (countedAdditions > 0)
    console.log(relations)
    console.log(forcedTransitions)
    return transitiveRelations;
}

function removeForcedProperty(property) {
    let relations = fromD3js(links, nodes)[1]
    const toBeRemoved = forcedTransitions[property];
    for (const transition of toBeRemoved) {
        relations[transition[0]][transition[1]] = relations[transition[0]][transition[1]].filter(t => t !== transition[2])
    }
    forcedTransitions[property] = []
    return relations;
}


export { forceReflexivity, forceSymmetry, forceTransitivity, forcedTransitions, removeForcedProperty }