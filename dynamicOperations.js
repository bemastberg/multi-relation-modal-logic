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
                    if (Object.keys(newWorlds).includes(String(successor))) {
                        newRelation[agent][world].push(successor);
                    }
                }
            };
        }
    }
    return [newWorlds, newRelation];

}
// function that creates an intersection of a communicationg group's set of relations,
// then intersects this with the relation of every agent
// also returns the symmetric difference, to see which edges to remove
function publicCommunication(agents, communicatingAgents, worlds, relations) {
    const notCommunicatingAgents = agents.filter(agent => !communicatingAgents.includes(agent))
    let communicatingAgentsRelation = new Object();
    let newRelation = new Object();
    let differenceRelation = new Object();
    for (const agent of agents) {
        newRelation[agent] = new Object();
        differenceRelation[agent] = new Object()
    }
    if (communicatingAgents.length > 1)
    // intersect relations of communication agents if more than one agent
    {
        for (const world of Object.keys(worlds)) {
            let toBeIntersected = new Array();
            //let difference = new Array();
            //let union = new Set()
            for (const agent of communicatingAgents) {
                toBeIntersected.push([...relations[agent][world]]);
                //union.push(...relations[agent][world])
            }
            if (toBeIntersected.length > 0) {
                var intersectedWorld = new Array(toBeIntersected.reduce((a, b) => a.filter(c => b.includes(c))));
            } else { var intersectedWorld = new Array() }
            communicatingAgentsRelation[world] = intersectedWorld;
            //differenceRelation[world] = union.filter(w => !intersectedWorld.includes(i));
        };
    } else { communicatingAgentsRelation = relations[communicatingAgents]; }
    // intersect remaining agent's relations with communicating agents
    for (const world of Object.keys(worlds)) {
        for (const agent of communicatingAgents) {
            newRelation[agent][world] = communicatingAgentsRelation[world].flat(1);
            differenceRelation[agent][world] = relations[agent][world].filter(w => !newRelation[agent][world].includes(w));
        }
        for (const agent of notCommunicatingAgents) {
            newRelation[agent][world] = new Array(relations[agent][world], communicatingAgentsRelation[world]).reduce((a, b) => a.filter(c => b.includes(c)));
            newRelation[agent][world] = newRelation[agent][world].flat(1)
            differenceRelation[agent][world] = relations[agent][world].filter(w => !newRelation[agent][world].includes(w));
        }
    }
    console.log(differenceRelation)
    return [newRelation, differenceRelation];
}


export { publicAnnouncement, publicCommunication };