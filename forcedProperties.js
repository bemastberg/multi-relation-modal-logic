import { relations } from "./parser_test.js";
let forcedTransitions = new Object()
forcedTransitions["Transitive"] = new Array();
forcedTransitions["Symmetric"] = new Array();
forcedTransitions["Reflexive"] = new Array();

function forceReflexivity() {
    let reflexiveRelations = relations;
    for (const agent of Object.keys(reflexiveRelations)) {
        for (const world of Object.keys(reflexiveRelations[agent])) {
            if (!reflexiveRelations[agent][world].includes(parseInt(world))) {
                reflexiveRelations[agent][world].push(parseInt(world));
                forcedTransitions["Reflexive"].push([agent, world, parseInt(world)]);
            }
        }
    }
    return reflexiveRelations;

}
function forceSymmetry() {
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
                            forcedTransitions["Transitive"].push([agent, world, parseInt(successorOfSuccessor)])
                            countedAdditions++;
                        }
                    }
                }
            }
        }
    } while (countedAdditions > 0)
    console.log(forcedTransitions)
    return transitiveRelations;
}

function removeForcedProperty(property) {
    const toBeRemoved = forcedTransitions[property];
    for (const transition of toBeRemoved) {
        relations[transition[0]][transition[1]] = relations[transition[0]][transition[1]].filter(t => t !== transition[2])
    }
    return relations;
}


export { forceReflexivity, forceSymmetry, forceTransitivity, forcedTransitions, removeForcedProperty }