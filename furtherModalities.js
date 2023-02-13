import { worlds, relations } from "./parser_test.js";

// Cartesian used for modal operators E(xistential) and D(ifference), as well as to calculate the inaccessibility (complement) relation
function cartesian(reflexive) {
    let cartesianRelations = new Object();
    for (const world of Object.keys(worlds)) {
        cartesianRelations[world] = new Array();
    }
    if (reflexive === true) {
        for (const world of Object.keys(worlds)) {
            cartesianRelations[world] = Object.keys(worlds).map(w => parseInt(w));
        }
    } else {
        for (const world of Object.keys(worlds)) {
            cartesianRelations[world] = Object.keys(worlds).filter(w => w !== world).map(w => parseInt(w));
        }
    }
    return cartesianRelations;
}

function complement(worlds, relations) {
    const cartesianProductOfDomain = cartesian(true);
    let complemented = new Object();
    const agents = Object.keys(relations);
    for (const agent of agents) {
        complemented[agent] = new Object();
        for (const world of Object.keys(worlds)) {
            const toBeAdded = new Array(cartesianProductOfDomain[world].filter(w => !relations[agent][world].includes(w)));
            complemented[agent][world] = toBeAdded;
        }

    }
    return complemented;
}
// Function to create the inverse relation for each agent
// Iterates through each transition and assigns the target world as source world (and vice verca)
function inverse(worlds, relations) {
    let invertedRelation = new Object();
    const agents = Object.keys(relations);
    for (const agent of agents) {
        invertedRelation[agent] = new Object();
        for (const world of Object.keys(worlds)) {
            invertedRelation[agent][world] = new Array()
        };
        for (const world of Object.keys(worlds)) {
            for (const successor of relations[agent][world]) {
                invertedRelation[agent][successor].push(world);
            }
        }
    }
    return invertedRelation;
}

export { cartesian, complement, inverse };