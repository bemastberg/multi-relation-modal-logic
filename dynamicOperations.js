import { truth } from "./parser_test.js";

function publicAnnouncement(formula, worlds, relations) {
    let newRelation = new Object();
    let newWorlds = new Object();
    // Add worlds that "survive" the public announcement to the new domain
    for (const world of Object.keys(worlds)) {
        if (truth(world, worlds, relations, formula)) {
            newWorlds[world] = worlds[world];
        }
    }
    // fill the new relations with surviving worlds
    for (const agent of Object.keys(relations)) {
        newRelation[agent] = new Object();
        for (const world of Object.keys(relations[agent])) {
            if (Object.keys(newWorlds).includes(world)) {
                newRelation[agent][world] = new Array();

                for (const successor of relations[agent][world]) {
                    console.log(successor);
                    console.log(Object.keys(newWorlds));
                    if (Object.keys(newWorlds).includes(String(successor))) {
                        newRelation[agent][world].push(successor);
                    }
                }
            };
        }
    }
    return [newWorlds, newRelation];

}

function publicCommunication(agents, communicatingAgents, worlds, relations) {
    const notCommunicatingAgents = agents.filter(agent => !communicatingAgents.includes(agent))
    let communicatingAgentsRelation = new Object();
    let newRelation = new Object();
    // step one: intersect relations of communication agents
    for (const world of Object.keys(worlds)) {
        let toBeIntersected = new Array();
        for (const agent of communicatingAgents) {
            toBeIntersected.push([...relations[agent][world]]);
        }
        if (toBeIntersected.length > 0) {
            var intersectedWorld = new Set(toBeIntersected.reduce((a, b) => a.filter(c => b.includes(c))));
        } else { continue }
        communicatingAgentsRelation[world] = intersectedWorld;
    };
    // step two: intersect remaining agent's relations with communicating agents
    for (const world of Object.keys(worlds)) {
        for (const agent of communicatingAgents) {
            newRelation[agent][world] = communicatingAgentsRelation[world];
        }
        for (const agent of notCommunicatingAgents) {
            newRelation[agent][world] = new Set(new Array(relations[agent][world], communicatingAgentsRelation[world]).reduce((a, b) => a.filter(c => b.includes(c))))
        }
    }
    return newRelation;
}


export { publicAnnouncement, publicCommunication };