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
    console.log(newRelation)
    return newRelation;

}

export { everybodyKnows }