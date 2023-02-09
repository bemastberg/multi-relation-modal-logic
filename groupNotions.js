// Functions to calculate everybody knows, common and distributed knowledge

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

function commonKnowledge(agents, worlds, relations) {
    let relation = everybodyKnows(agents, worlds, relations)
    let is_transitive = false;
    do {
        let changes = 0
        for (const world of Object.keys(relation)) {
            for (const successor of relation[world]) {
                const toBeAdded = new Array([...relation[successor]].filter(x => !relation[world].includes(x)));
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

export { everybodyKnows, distributedKnowledge, commonKnowledge }