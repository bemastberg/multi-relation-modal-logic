// Function to return an array of strings representing the power set of agents (except the empty set)
// (needed for the Communication action)
// Inspired by https://medium.com/@abc810221/powerset-algorithm-760512ee60f3

function powerSet(agents) {
    let result = [''];
    for (let i = 0; i < agents.length; i++) {
        let len = result.length;
        for (let x = 0; x < len; x++) {
            result.push(result[x].concat(agents[i]));
        }
    }
    return result.slice(1);
}

export { powerSet }