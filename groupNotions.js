// Functions to calculate everybody knows, common and distributed knowledge
//import { worlds, relations } from "./parser_test";

function everybodyKnows(agents, worlds, relations) {
    let newRelation = new Object();
    for (const world of Object.keys(worlds)) {
        let toBeUnionized = new Array();
        for (const agent of agents) {
            toBeUnionized.push(...relations[agent][world]);
        }
        newRelation[world] = [...new Set(toBeUnionized)];
    }
    return newRelation;

}

function distributedKnowledge(agents, worlds, relations) {
    let newRelation = new Object();
    for (const world of Object.keys(worlds)) {
        let toBeIntersected = new Array();
        for (const agent of agents) {
            toBeIntersected.push([...relations[agent][world]]);
        }
        if (toBeIntersected.length > 0) {
            var intersectedWorld = new Array(toBeIntersected.reduce((a, b) => a.filter(c => b.includes(c))));
        } else { continue }
        newRelation[world] = intersectedWorld;
    }

    return newRelation;

}

export { everybodyKnows, distributedKnowledge }