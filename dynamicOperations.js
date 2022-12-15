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

export { publicAnnouncement };